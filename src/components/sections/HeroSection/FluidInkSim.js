/**
 * WebGL ink-in-water simulation
 * Curl-noise advection + diffusion + periodic water surface glow
 * + Camera background blending + hand/pointer velocity disturbance
 */
const SIM_RES = 512;

const VERT = `attribute vec2 a;varying vec2 uv;
void main(){uv=a*.5+.5;gl_Position=vec4(a,0,1);}`;

// 잉크 splat — 순수 가우시안 (alpha 최대 0.80으로 제한 → 항상 반투명)
const SPLAT_FRAG = `precision highp float;
uniform sampler2D uT;uniform vec2 uP;uniform vec3 uC;uniform float uR;varying vec2 uv;
void main(){
  vec2 d=uv-uP;
  float s=exp(-dot(d,d)/uR);
  vec4 cur=texture2D(uT,uv);
  vec3 col=mix(cur.rgb,uC,s*(1.-cur.a*.5));
  gl_FragColor=vec4(col,min(cur.a+s*.14,0.80));
}`;

// 잉크 advect + diffuse + 손동작 속도장 교란
const ADVECT_FRAG = `precision highp float;
uniform sampler2D uT;uniform float uTime;uniform vec2 uPx;
uniform vec2 uHand;uniform vec2 uHandVel;uniform float uHandOn;
varying vec2 uv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.545);}
float gn(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y)*2.-1.;
}
vec2 curl(vec2 p){
  const float e=.01;
  return vec2(gn(p+vec2(0,e))-gn(p-vec2(0,e)),-(gn(p+vec2(e,0))-gn(p-vec2(e,0))))/(2.*e);
}
void main(){
  vec2 vel=curl(uv*4.0+uTime*.068)*.00110;
  if(uHandOn>0.5){
    vec2 d=uv-uHand;
    float inf=exp(-dot(d,d)*60.0);
    vel+=uHandVel*inf;
  }
  vec4 adv=texture2D(uT,uv-vel);
  vec4 d1=texture2D(uT,uv+vec2(uPx.x*2.,0.));
  vec4 d2=texture2D(uT,uv-vec2(uPx.x*2.,0.));
  vec4 d3=texture2D(uT,uv+vec2(0.,uPx.y*2.));
  vec4 d4=texture2D(uT,uv-vec2(0.,uPx.y*2.));
  gl_FragColor=mix(adv,(adv+d1+d2+d3+d4)/5.,.15);
}`;

// 화면 출력 — 수면 + 코스틱 + 카메라 배경 블렌딩
const DISPLAY_FRAG = `precision highp float;
uniform sampler2D uT;
uniform sampler2D uCam;
uniform float uTime;
uniform float uHasCam;
varying vec2 uv;

float caustic(vec2 p,float t){
  float c=sin(p.x*7.8+t*1.05)*cos(p.y*6.1-t*.78)
         +sin(p.x*4.9-t*.65)*cos(p.y*8.7+t*1.25)
         +sin((p.x+p.y)*6.4+t*.92)*.55
         +cos((p.x-p.y)*5.1-t*1.18)*.40;
  return pow(max(c*.28+.5,0.),4.);
}

void main(){
  // 수면 물결 왜곡 UV
  float rx=sin(uv.x*52.+uTime*1.2)*sin(uv.y*41.+uTime*.75)*.0018;
  float ry=cos(uv.x*47.+uTime*.85)*cos(uv.y*58.+uTime*1.45)*.0018;
  vec2 wUV=uv+vec2(rx,ry);

  vec4 dye=texture2D(uT,wUV);
  float ia=clamp(dye.a*.85,0.,1.);

  // 수면 기본색 — 카메라 허용 시 웹캠 블렌딩
  vec3 water=vec3(.955,.967,.985);
  if(uHasCam>0.5){
    vec2 camUV=vec2(1.0-wUV.x,wUV.y);
    vec3 cam=texture2D(uCam,camUV).rgb;
    float cl=dot(cam,vec3(.299,.587,.114));
    cam=mix(vec3(cl),cam,0.45)*0.4+0.58;
    water=mix(water,cam,0.35);
  }

  // 코스틱: 잉크 두께에 따른 굴절
  vec2 inkRefract=vec2(rx,ry)*7.0*ia;
  float ca=caustic(uv*2.4+inkRefract,uTime*.48);
  vec3 base=water+vec3(.86,.96,1.0)*ca*.07;

  // 잉크 색상 추출
  vec3 ink=dye.a>.001?dye.rgb/dye.a:vec3(0.);
  vec3 lum=vec3(dot(ink,vec3(.299,.587,.114)));
  ink=clamp(mix(lum,ink,1.00),0.,1.)*0.72;

  // 반투명 합성
  vec3 col=mix(base,mix(base,ink,.65),ia);

  // 수면 코스틱 오버레이
  col+=vec3(.90,.97,1.)*ca*.018;

  gl_FragColor=vec4(min(col,vec3(1.)),1.);
}`;

function mkShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}
function mkProg(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, mkShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, mkShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p); return p;
}
function mkFBO(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo };
}


export default class FluidInkSim {
  constructor(canvas) {
    this.canvas = canvas;
    this.time = 0;
    const gl = canvas.getContext('webgl', { alpha: false, depth: false, antialias: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this._sp = mkProg(gl, SPLAT_FRAG);
    this._ap = mkProg(gl, ADVECT_FRAG);
    this._dp = mkProg(gl, DISPLAY_FRAG);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    this._buf = buf;

    this._fbos = [mkFBO(gl, SIM_RES, SIM_RES), mkFBO(gl, SIM_RES, SIM_RES)];
    this._r = 0;
    this._fbos.forEach(({ fbo }) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 카메라 텍스처 (1x1 블랙 플레이스홀더로 초기화 — GPU 안전)
    this._camTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._camTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]));
    this._hasCam = false;

    // 손/포인터 교란 상태
    this._handPos = [0, 0];
    this._handVel = [0, 0];
    this._handOn = false;
  }

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

  /** 비디오 프레임을 카메라 텍스처로 업로드 */
  setCameraFrame(video) {
    if (!video || video.readyState < 2) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this._camTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    this._hasCam = true;
  }

  /** 손/포인터 위치·속도 설정 → 수면 교란 */
  setHandState(x, y, vx, vy) {
    this._handPos = [x, 1 - y]; // GL y 반전
    this._handVel = [vx, -vy];
    this._handOn = true;
  }

  clearHandState() {
    this._handOn = false;
  }

  // normX/normY: [0,1] canvas UV (y=0 is top)
  splat(normX, normY, color, radius = 1) {
    const gl = this.gl;
    const w = 1 - this._r;
    gl.useProgram(this._sp);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[w].fbo);
    gl.viewport(0, 0, SIM_RES, SIM_RES);
    this._tex(this._sp, 'uT', 0, this._fbos[this._r].tex);
    gl.uniform2f(gl.getUniformLocation(this._sp, 'uP'), normX, 1.0 - normY);
    gl.uniform3f(gl.getUniformLocation(this._sp, 'uC'), color[0], color[1], color[2]);
    gl.uniform1f(gl.getUniformLocation(this._sp, 'uR'), 0.0022 * radius * radius);
    this._draw(this._sp);
    this._r = w;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  step(dt) {
    const gl = this.gl;
    this.time += dt;

    // 잉크 advect + diffuse + hand disturbance
    const w = 1 - this._r;
    gl.useProgram(this._ap);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[w].fbo);
    gl.viewport(0, 0, SIM_RES, SIM_RES);
    this._tex(this._ap, 'uT', 0, this._fbos[this._r].tex);
    gl.uniform1f(gl.getUniformLocation(this._ap, 'uTime'), this.time);
    gl.uniform2f(gl.getUniformLocation(this._ap, 'uPx'), 1/SIM_RES, 1/SIM_RES);
    gl.uniform2f(gl.getUniformLocation(this._ap, 'uHand'),
      this._handPos[0], this._handPos[1]);
    gl.uniform2f(gl.getUniformLocation(this._ap, 'uHandVel'),
      this._handVel[0], this._handVel[1]);
    gl.uniform1f(gl.getUniformLocation(this._ap, 'uHandOn'),
      this._handOn ? 1.0 : 0.0);
    this._draw(this._ap);
    this._r = w;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 화면 출력
    gl.useProgram(this._dp);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this._tex(this._dp, 'uT', 0, this._fbos[this._r].tex);
    this._tex(this._dp, 'uCam', 1, this._camTex);
    gl.uniform1f(gl.getUniformLocation(this._dp, 'uHasCam'), this._hasCam ? 1.0 : 0.0);
    gl.uniform1f(gl.getUniformLocation(this._dp, 'uTime'), this.time);
    this._draw(this._dp);
  }

  resize(w, h) {
    this.canvas.width  = Math.max(1, w);
    this.canvas.height = Math.max(1, h);
  }

  clear() {
    const gl = this.gl;
    this._fbos.forEach(({ fbo }) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  dispose() {
    const gl = this.gl;
    this._fbos.forEach(({ tex, fbo }) => { gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); });
    gl.deleteTexture(this._camTex);
    gl.deleteBuffer(this._buf);
    [this._sp, this._ap, this._dp].forEach(p => gl.deleteProgram(p));
  }
}
