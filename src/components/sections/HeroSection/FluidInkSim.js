/**
 * Navier-Stokes WebGL ink-in-water simulation
 *
 * Pipeline per frame:
 *   1. Velocity splat (hand/mouse forces)
 *   2. Dye splat (ink color)
 *   3. Advect velocity (self-advection)
 *   4. Advect dye
 *   5. Compute vorticity (curl of velocity)
 *   6. Vorticity confinement (preserve turbulent detail)
 *   7. Compute divergence
 *   8. Pressure solve (Jacobi iterations)
 *   9. Gradient subtract (enforce incompressibility)
 *  10. Display (camera + water + multiply-blended ink)
 */

const SIM = 512;
const JACOBI = 24;
const VEL_DISS  = 0.98;   // velocity dissipation — momentum persists ~2s
const DYE_DISS  = 0.997;  // dye dissipation — ink fades very slowly
const VORT_STR  = 8.0;    // vorticity confinement strength (gentle swirl)
const HAND_FORCE = 400.0; // hand velocity amplification
const SPLAT_R   = 0.0015; // base Gaussian radius for velocity splats
const INK_ALPHA = 0.12;   // density added per dye splat unit

/* ────────────────────── shaders ────────────────────── */

const VERT = `attribute vec2 a;varying vec2 uv;
void main(){uv=a*.5+.5;gl_Position=vec4(a,0,1);}`;

// Generic splat — velocity (uA=0) or dye (uA>0, weighted-average blend)
const SPLAT = `precision highp float;
uniform sampler2D uT;uniform vec2 uP;uniform vec3 uC;
uniform float uR;uniform float uAsp;uniform float uA;
varying vec2 uv;
void main(){
  vec2 d=uv-uP; d.x*=uAsp;
  float s=exp(-dot(d,d)/uR);
  vec4 b=texture2D(uT,uv);
  if(uA<.001){
    // Velocity splat — additive
    gl_FragColor=vec4(b.rgb+uC*s, b.a);
  } else {
    // Dye splat — weighted average so colors never add to white
    float w=uA*s;
    float newA=b.a+w;
    vec3 prev=b.rgb/max(b.a,.001);
    vec3 blended=mix(prev,uC,w/max(newA,.001));
    gl_FragColor=vec4(blended*newA, newA);
  }
}`;

// Semi-Lagrangian advection with bilinear interpolation
const ADVECT = `precision highp float;
uniform sampler2D uV;uniform sampler2D uS;
uniform vec2 uTx;uniform float uDt;uniform float uDis;
varying vec2 uv;
vec4 bl(sampler2D s,vec2 p){
  vec2 st=p/uTx-.5;vec2 i=floor(st);vec2 f=fract(st);
  vec4 a=texture2D(s,(i+.5)*uTx);
  vec4 b=texture2D(s,(i+vec2(1.5,.5))*uTx);
  vec4 c=texture2D(s,(i+vec2(.5,1.5))*uTx);
  vec4 d=texture2D(s,(i+1.5)*uTx);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
void main(){
  vec2 vel=texture2D(uV,uv).xy;
  vec2 c=uv-vel*uDt;
  gl_FragColor=uDis*bl(uS,c);
}`;

// Divergence of velocity
const DIVERG = `precision highp float;
uniform sampler2D uV;uniform vec2 uTx;varying vec2 uv;
void main(){
  float L=texture2D(uV,uv-vec2(uTx.x,0)).x;
  float R=texture2D(uV,uv+vec2(uTx.x,0)).x;
  float B=texture2D(uV,uv-vec2(0,uTx.y)).y;
  float T=texture2D(uV,uv+vec2(0,uTx.y)).y;
  gl_FragColor=vec4(.5*(R-L+T-B),0,0,1);
}`;

// Pressure solve — Jacobi iteration
const PRES = `precision highp float;
uniform sampler2D uP;uniform sampler2D uD;uniform vec2 uTx;varying vec2 uv;
void main(){
  float pL=texture2D(uP,uv-vec2(uTx.x,0)).x;
  float pR=texture2D(uP,uv+vec2(uTx.x,0)).x;
  float pB=texture2D(uP,uv-vec2(0,uTx.y)).x;
  float pT=texture2D(uP,uv+vec2(0,uTx.y)).x;
  float d=texture2D(uD,uv).x;
  gl_FragColor=vec4((pL+pR+pB+pT-d)*.25,0,0,1);
}`;

// Gradient subtract — enforce incompressibility
const GRAD = `precision highp float;
uniform sampler2D uP;uniform sampler2D uV;uniform vec2 uTx;varying vec2 uv;
void main(){
  float pL=texture2D(uP,uv-vec2(uTx.x,0)).x;
  float pR=texture2D(uP,uv+vec2(uTx.x,0)).x;
  float pB=texture2D(uP,uv-vec2(0,uTx.y)).x;
  float pT=texture2D(uP,uv+vec2(0,uTx.y)).x;
  vec2 v=texture2D(uV,uv).xy;
  gl_FragColor=vec4(v-vec2(pR-pL,pT-pB)*.5,0,1);
}`;

// Vorticity (curl of velocity)
const VORT = `precision highp float;
uniform sampler2D uV;uniform vec2 uTx;varying vec2 uv;
void main(){
  float L=texture2D(uV,uv-vec2(uTx.x,0)).y;
  float R=texture2D(uV,uv+vec2(uTx.x,0)).y;
  float B=texture2D(uV,uv-vec2(0,uTx.y)).x;
  float T=texture2D(uV,uv+vec2(0,uTx.y)).x;
  gl_FragColor=vec4((R-L-T+B)*.5,0,0,1);
}`;

// Vorticity confinement force
const VORT_F = `precision highp float;
uniform sampler2D uV;uniform sampler2D uW;
uniform vec2 uTx;uniform float uDt;uniform float uStr;
varying vec2 uv;
void main(){
  float wL=texture2D(uW,uv-vec2(uTx.x,0)).x;
  float wR=texture2D(uW,uv+vec2(uTx.x,0)).x;
  float wB=texture2D(uW,uv-vec2(0,uTx.y)).x;
  float wT=texture2D(uW,uv+vec2(0,uTx.y)).x;
  float wC=texture2D(uW,uv).x;
  vec2 f=.5*vec2(abs(wT)-abs(wB),abs(wR)-abs(wL));
  f/=max(length(f),1e-5);
  f*=wC;
  vec2 v=texture2D(uV,uv).xy;
  gl_FragColor=vec4(v+f*uDt*uStr,0,1);
}`;

// Display — camera (contain-fit) + water + multiply-blended ink
const DISPLAY = `precision highp float;
uniform sampler2D uDye;uniform sampler2D uCam;
uniform float uTime;uniform float uHasCam;
uniform float uCAsp;uniform float uVAsp;
varying vec2 uv;

float caustic(vec2 p,float t){
  float c=sin(p.x*7.8+t*1.05)*cos(p.y*6.1-t*.78)
         +sin(p.x*4.9-t*.65)*cos(p.y*8.7+t*1.25)
         +sin((p.x+p.y)*6.4+t*.92)*.55
         +cos((p.x-p.y)*5.1-t*1.18)*.40;
  return pow(max(c*.28+.5,0.),4.);
}

void main(){
  // 수면 — 대규모 출렁임 + 잔물결
  float bx=sin(uv.x*6.+uTime*.3)*cos(uv.y*5.+uTime*.2)*.005;
  float by=cos(uv.x*5.+uTime*.25)*sin(uv.y*7.+uTime*.35)*.005;
  float sx=sin(uv.x*52.+uTime*1.2)*sin(uv.y*41.+uTime*.75)*.002;
  float sy=cos(uv.x*47.+uTime*.85)*cos(uv.y*58.+uTime*1.45)*.002;
  vec2 rip=vec2(bx+sx,by+sy);
  vec2 wUV=uv+rip;

  // 잉크
  vec4 dye=texture2D(uDye,wUV);
  float tx=1./512.;
  vec4 db=(texture2D(uDye,wUV+vec2(tx,0))+texture2D(uDye,wUV-vec2(tx,0))
          +texture2D(uDye,wUV+vec2(0,tx))+texture2D(uDye,wUV-vec2(0,tx)))*.25;
  dye=dye+(dye-db)*.15;

  float den=clamp(dye.a,0.,1.);
  // 부드러운 불투명도 — 얇은 가장자리에서 밝아지지 않음
  float alpha=smoothstep(0.,.55,den)*.88;

  // 잉크 색소 — 저밀도 증폭 방지 (divisor 바닥 0.18)
  vec3 ink=den>.02?clamp(dye.rgb/max(den,.18),0.,1.):vec3(1.);

  // 코스틱
  float ca=caustic(uv*2.4,uTime*.48);

  vec3 base;
  if(uHasCam>.5){
    // Contain-fit: scale UV to preserve video aspect ratio
    float fitX=uVAsp>uCAsp?1.:uVAsp/uCAsp;
    float fitY=uVAsp>uCAsp?uCAsp/uVAsp:1.;
    vec2 cuv=(wUV-.5)/vec2(fitX,fitY)+.5;

    if(cuv.x<0.||cuv.x>1.||cuv.y<0.||cuv.y>1.){
      // Letterbox area — white background with caustic
      base=vec3(1.)+vec3(.86,.96,1.)*ca*.04;
    } else {
      // Mirror X for selfie + water distortion
      cuv.x=1.-cuv.x;
      float rx=sin(cuv.y*30.+uTime*.8)*cos(cuv.x*25.)*.006;
      float ry=cos(cuv.x*35.+uTime*1.1)*sin(cuv.y*20.)*.006;
      cuv+=vec2(rx,ry);
      base=texture2D(uCam,clamp(cuv,0.,1.)).rgb;
      base+=vec3(.85,.93,1.)*ca*.08;
    }
  } else {
    vec3 w=vec3(.955,.967,.985);
    base=w+vec3(.86,.96,1.)*ca*.07+vec3(.9,.97,1.)*ca*.018;
  }

  // Multiply 블렌딩 — 잉크가 배경을 물들임
  vec3 tint=mix(vec3(1.),ink,alpha*.92);
  vec3 col=base*tint;

  gl_FragColor=vec4(min(col,vec3(1.)),1.);
}`;

/* ────────────────────── helpers ────────────────────── */

function mkS(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error(gl.getShaderInfoLog(s));
  return s;
}
function mkP(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, mkS(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, mkS(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error(gl.getProgramInfoLog(p));
  return p;
}

function getTexType(gl) {
  // Try float → half-float → unsigned byte
  const tryType = (ext, type) => {
    if (!ext) return false;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, type, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteTexture(tex); gl.deleteFramebuffer(fb);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok ? type : false;
  };

  const fe = gl.getExtension('OES_texture_float');
  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('WEBGL_color_buffer_float');
  let t = tryType(fe, gl.FLOAT);
  if (t) return t;

  const he = gl.getExtension('OES_texture_half_float');
  gl.getExtension('OES_texture_half_float_linear');
  gl.getExtension('EXT_color_buffer_half_float');
  t = tryType(he, he?.HALF_FLOAT_OES);
  if (t) return t;

  return gl.UNSIGNED_BYTE;
}

function mkFBO(gl, w, h, type) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo };
}

// Ping-pong double buffer
class DFBO {
  constructor(gl, w, h, type) {
    this.a = mkFBO(gl, w, h, type);
    this.b = mkFBO(gl, w, h, type);
  }
  get r() { return this.a; }
  get w() { return this.b; }
  swap() { [this.a, this.b] = [this.b, this.a]; }
}

/* ────────────────────── simulation ────────────────────── */

export default class FluidInkSim {
  constructor(canvas) {
    this.canvas = canvas;
    this.time = 0;
    this._aspect = 1;
    const gl = canvas.getContext('webgl', { alpha: false, depth: false, antialias: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this._texType = getTexType(gl);

    // Shader programs
    this._p = {
      splat: mkP(gl, SPLAT), advect: mkP(gl, ADVECT),
      div: mkP(gl, DIVERG), pres: mkP(gl, PRES), grad: mkP(gl, GRAD),
      vort: mkP(gl, VORT), vortF: mkP(gl, VORT_F), disp: mkP(gl, DISPLAY),
    };

    // Vertex buffer (fullscreen quad)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    this._buf = buf;

    // Simulation buffers
    const T = this._texType;
    this._vel  = new DFBO(gl, SIM, SIM, T);
    this._pres = new DFBO(gl, SIM, SIM, T);
    this._dye  = new DFBO(gl, SIM, SIM, T);
    this._divB = mkFBO(gl, SIM, SIM, T);
    this._vrtB = mkFBO(gl, SIM, SIM, T);

    // Clear all
    this._clearAll();

    // Camera texture
    this._camTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._camTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]));
    this._hasCam = false;
    this._camAsp = 1.333; // default 4:3 until first frame

    // Hand state
    this._handPos = [0, 0];
    this._handVel = [0, 0];
    this._handOn = false;
  }

  /* ── internal rendering ── */

  _draw(prog) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(prog, 'a');
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  _tex(prog, name, unit, tex) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
  }

  _clearFBO(fbo) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _clearAll() {
    [this._vel.a, this._vel.b, this._pres.a, this._pres.b,
     this._dye.a, this._dye.b, this._divB, this._vrtB].forEach(f => this._clearFBO(f));
  }

  _splatVel(x, y, vx, vy, radius) {
    const gl = this.gl, p = this._p.splat;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._vel.w.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uT', 0, this._vel.r.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uP'), x, y);
    gl.uniform3f(gl.getUniformLocation(p, 'uC'), vx, vy, 0);
    gl.uniform1f(gl.getUniformLocation(p, 'uR'), radius);
    gl.uniform1f(gl.getUniformLocation(p, 'uAsp'), this._aspect);
    gl.uniform1f(gl.getUniformLocation(p, 'uA'), 0);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._vel.swap();
  }

  _splatDye(x, y, color, radius) {
    const gl = this.gl, p = this._p.splat;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._dye.w.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uT', 0, this._dye.r.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uP'), x, y);
    gl.uniform3f(gl.getUniformLocation(p, 'uC'), color[0], color[1], color[2]);
    gl.uniform1f(gl.getUniformLocation(p, 'uR'), radius);
    gl.uniform1f(gl.getUniformLocation(p, 'uAsp'), this._aspect);
    gl.uniform1f(gl.getUniformLocation(p, 'uA'), INK_ALPHA);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._dye.swap();
  }

  _advect(target, velocity, dt, dissipation) {
    const gl = this.gl, p = this._p.advect;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.w.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uV', 0, velocity.r.tex);
    this._tex(p, 'uS', 1, target.r.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uTx'), 1 / SIM, 1 / SIM);
    gl.uniform1f(gl.getUniformLocation(p, 'uDt'), dt);
    gl.uniform1f(gl.getUniformLocation(p, 'uDis'), dissipation);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    target.swap();
  }

  _computeVorticity() {
    const gl = this.gl, p = this._p.vort;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._vrtB.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uV', 0, this._vel.r.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uTx'), 1 / SIM, 1 / SIM);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _applyVorticity(dt) {
    const gl = this.gl, p = this._p.vortF;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._vel.w.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uV', 0, this._vel.r.tex);
    this._tex(p, 'uW', 1, this._vrtB.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uTx'), 1 / SIM, 1 / SIM);
    gl.uniform1f(gl.getUniformLocation(p, 'uDt'), dt);
    gl.uniform1f(gl.getUniformLocation(p, 'uStr'), VORT_STR);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._vel.swap();
  }

  _computeDivergence() {
    const gl = this.gl, p = this._p.div;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._divB.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uV', 0, this._vel.r.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uTx'), 1 / SIM, 1 / SIM);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _pressureStep() {
    const gl = this.gl, p = this._p.pres;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._pres.w.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uP', 0, this._pres.r.tex);
    this._tex(p, 'uD', 1, this._divB.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uTx'), 1 / SIM, 1 / SIM);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._pres.swap();
  }

  _gradientSubtract() {
    const gl = this.gl, p = this._p.grad;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._vel.w.fbo);
    gl.viewport(0, 0, SIM, SIM);
    this._tex(p, 'uP', 0, this._pres.r.tex);
    this._tex(p, 'uV', 1, this._vel.r.tex);
    gl.uniform2f(gl.getUniformLocation(p, 'uTx'), 1 / SIM, 1 / SIM);
    this._draw(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._vel.swap();
  }

  _display() {
    const gl = this.gl, p = this._p.disp;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this._tex(p, 'uDye', 0, this._dye.r.tex);
    this._tex(p, 'uCam', 1, this._camTex);
    gl.uniform1f(gl.getUniformLocation(p, 'uHasCam'), this._hasCam ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(p, 'uTime'), this.time);
    gl.uniform1f(gl.getUniformLocation(p, 'uCAsp'), this._aspect);
    gl.uniform1f(gl.getUniformLocation(p, 'uVAsp'), this._camAsp);
    this._draw(p);
  }

  /* ── public API ── */

  /** Add ink at position (screen coords: y=0 top) */
  splat(normX, normY, color, radius = 1) {
    const x = normX, y = 1 - normY;
    const r = 0.0022 * radius * radius;
    this._splatDye(x, y, color, r);
    // Gentle velocity push for natural ink spread
    const angle = Math.random() * Math.PI * 2;
    const v = 0.18 + radius * 0.10;
    this._splatVel(x, y, Math.cos(angle) * v, Math.sin(angle) * v, r * 2);
  }

  /** Upload video frame as camera texture */
  setCameraFrame(video) {
    if (!video || video.readyState < 2) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this._camTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this._hasCam = true;
    this._camAsp = video.videoWidth / Math.max(video.videoHeight, 1);
  }

  /** Set hand/pointer position and velocity (screen coords) */
  setHandState(x, y, vx, vy) {
    this._handPos = [x, 1 - y];
    this._handVel = [vx, -vy];
    this._handOn = true;
  }

  clearHandState() { this._handOn = false; }

  /** Run one simulation frame */
  step(dt) {
    this.time += dt;

    // 1 — Hand/mouse velocity force
    if (this._handOn) {
      const [vx, vy] = this._handVel;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 0.0005) {
        this._splatVel(
          this._handPos[0], this._handPos[1],
          vx * HAND_FORCE, vy * HAND_FORCE,
          SPLAT_R * 3,
        );
      }
    }

    // 2 — Ambient flow (gentle random currents)
    if (Math.random() < 0.12) {
      const ax = Math.random(), ay = Math.random();
      const aa = this.time * 0.4 + ax * 6.28;
      this._splatVel(ax, ay, Math.cos(aa) * 0.06, Math.sin(aa) * 0.06, 0.04);
    }

    // 3 — Advect velocity (self-advection with dissipation)
    this._advect(this._vel, this._vel, dt, VEL_DISS);

    // 4 — Advect dye
    this._advect(this._dye, this._vel, dt, DYE_DISS);

    // 5 — Vorticity
    this._computeVorticity();

    // 6 — Vorticity confinement
    this._applyVorticity(dt);

    // 7 — Divergence
    this._computeDivergence();

    // 8 — Pressure solve (Jacobi)
    this._clearFBO(this._pres.a);
    this._clearFBO(this._pres.b);
    for (let i = 0; i < JACOBI; i++) this._pressureStep();

    // 9 — Gradient subtract
    this._gradientSubtract();

    // 10 — Display
    this._display();
  }

  resize(w, h) {
    this.canvas.width  = Math.max(1, w);
    this.canvas.height = Math.max(1, h);
    this._aspect = w / h;
  }

  clear() { this._clearAll(); }

  dispose() {
    const gl = this.gl;
    const del = (f) => { gl.deleteTexture(f.tex); gl.deleteFramebuffer(f.fbo); };
    [this._vel.a, this._vel.b, this._pres.a, this._pres.b,
     this._dye.a, this._dye.b, this._divB, this._vrtB].forEach(del);
    gl.deleteTexture(this._camTex);
    gl.deleteBuffer(this._buf);
    Object.values(this._p).forEach(p => gl.deleteProgram(p));
  }
}
