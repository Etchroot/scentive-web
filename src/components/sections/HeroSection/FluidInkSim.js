/**
 * WebGL ink-in-water simulation
 * Curl-noise advection + soft diffusion (no pressure solve needed for visual ink)
 */
const SIM_RES = 512;

const VERT = `attribute vec2 a;varying vec2 uv;
void main(){uv=a*.5+.5;gl_Position=vec4(a,0,1);}`;

const SPLAT_FRAG = `precision highp float;
uniform sampler2D uT;uniform vec2 uP;uniform vec3 uC;uniform float uR;varying vec2 uv;
void main(){
  vec2 d=uv-uP;float s=exp(-dot(d,d)/uR);
  vec4 cur=texture2D(uT,uv);
  vec3 col=mix(cur.rgb,uC,s*(1.-cur.a*.5));
  gl_FragColor=vec4(col,min(cur.a+s*.6,1.));
}`;

const ADVECT_FRAG = `precision highp float;
uniform sampler2D uT;uniform float uTime;uniform vec2 uPx;varying vec2 uv;
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
  vec2 vel=curl(uv*3.5+uTime*.045)*.0013;
  vec4 adv=texture2D(uT,uv-vel);
  vec4 d1=texture2D(uT,uv+vec2(uPx.x*2.,0.));
  vec4 d2=texture2D(uT,uv-vec2(uPx.x*2.,0.));
  vec4 d3=texture2D(uT,uv+vec2(0.,uPx.y*2.));
  vec4 d4=texture2D(uT,uv-vec2(0.,uPx.y*2.));
  gl_FragColor=mix(adv,(adv+d1+d2+d3+d4)/5.,.18);
}`;

const DISPLAY_FRAG = `precision highp float;
uniform sampler2D uT;uniform float uTime;varying vec2 uv;
void main(){
  float rx=sin(uv.x*52.+uTime*1.2)*sin(uv.y*41.+uTime*.75)*.0016;
  float ry=cos(uv.x*47.+uTime*.85)*cos(uv.y*58.+uTime*1.45)*.0016;
  vec4 dye=texture2D(uT,uv+vec2(rx,ry));
  vec3 water=vec3(.955,.967,.985);
  vec3 ink=dye.a>.001?dye.rgb/dye.a:water;
  vec3 g=vec3(dot(ink,vec3(.299,.587,.114)));
  ink=clamp(mix(g,ink,1.35),0.,1.);
  float ia=clamp(dye.a*2.,0.,1.);
  vec3 col=mix(water,ink,ia*.87);
  float sh=(sin(uv.x*85.+uTime*2.1)*sin(uv.y*70.+uTime*1.7)*.5+.5)*.013*(1.-ia*.5);
  gl_FragColor=vec4(col+sh,1.);
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
    const w = 1 - this._r;
    // Advect + diffuse
    gl.useProgram(this._ap);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbos[w].fbo);
    gl.viewport(0, 0, SIM_RES, SIM_RES);
    this._tex(this._ap, 'uT', 0, this._fbos[this._r].tex);
    gl.uniform1f(gl.getUniformLocation(this._ap, 'uTime'), this.time);
    gl.uniform2f(gl.getUniformLocation(this._ap, 'uPx'), 1/SIM_RES, 1/SIM_RES);
    this._draw(this._ap);
    this._r = w;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Display
    gl.useProgram(this._dp);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this._tex(this._dp, 'uT', 0, this._fbos[this._r].tex);
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
    gl.deleteBuffer(this._buf);
    [this._sp, this._ap, this._dp].forEach(p => gl.deleteProgram(p));
  }
}
