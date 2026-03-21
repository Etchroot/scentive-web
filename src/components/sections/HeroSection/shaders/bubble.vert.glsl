uniform float uTime;
uniform float uFill;
uniform float uHover;
uniform float uScale;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vFill;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vFill = uFill;

  // 호버 시 약간 팽창
  float scaleBoost = 1.0 + uHover * 0.04;
  vec3 displaced = position * scaleBoost * uScale;

  // 유체 표면 노이즈 (채워진 정도에 따라)
  float noise = sin(position.x * 8.0 + uTime * 2.0) * cos(position.y * 8.0 + uTime * 1.5) * 0.015;
  displaced += normal * noise * uFill;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
