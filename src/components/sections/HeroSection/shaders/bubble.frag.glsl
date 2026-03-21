uniform float uTime;
uniform float uFill;
uniform float uHover;
uniform vec3  uFluidColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vFill;

// 무지개빛 이리데슨트 효과
vec3 iridescent(vec3 normal, float time) {
  float fresnel = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.5);
  vec3 col = vec3(0.0);
  col += vec3(0.95, 0.85, 1.0) * sin(fresnel * 6.0 + time * 0.8) * 0.5 + 0.5;
  col += vec3(1.0, 0.9, 0.8) * cos(fresnel * 4.0 - time * 0.5) * 0.3;
  col += vec3(0.8, 1.0, 0.95) * sin(fresnel * 8.0 + time * 1.2) * 0.2;
  return clamp(col * 0.6 + 0.4, 0.0, 1.0);
}

// 스월 노이즈
float swirl(vec3 p, float time) {
  return sin(p.x * 5.0 + time) * cos(p.y * 5.0 - time * 0.7) * sin(p.z * 5.0 + time * 0.5);
}

void main() {
  vec3 normal = normalize(vNormal);

  // 이리데슨트 투명 (uFill = 0)
  vec3 iriColor = iridescent(normal, uTime);

  // 유체 색상 + 스월 (uFill = 1)
  float sw = swirl(vPosition, uTime * 1.5) * 0.5 + 0.5;
  vec3 fluidColor = mix(uFluidColor, uFluidColor * 1.3, sw);
  fluidColor = clamp(fluidColor, 0.0, 1.0);

  // 블렌딩
  vec3 finalColor = mix(iriColor, fluidColor, uFill);

  // 프레넬 림라이트
  float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  finalColor += vec3(1.0) * fresnel * 0.15;

  // 투명도: 빈 버블은 반투명, 찬 버블은 불투명
  float baseAlpha = 0.35 + uFill * 0.55;
  float rimAlpha = fresnel * 0.4;
  float alpha = clamp(baseAlpha + rimAlpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
