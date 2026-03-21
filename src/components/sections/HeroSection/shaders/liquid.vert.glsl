uniform float uTime;
uniform float uLevel;

varying vec2 vUv;

void main() {
  vUv = uv;
  // 수면 흔들림
  float wave = sin(uv.x * 12.0 + uTime * 2.5) * 0.008 * uLevel;
  vec3 pos = position;
  pos.y += wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
