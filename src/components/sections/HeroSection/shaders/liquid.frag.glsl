uniform float uTime;
uniform float uLevel;
uniform vec3  uLiquidColor;

varying vec2 vUv;

void main() {
  // 수위 클리핑 — uLevel 이하만 렌더
  float level = uLevel;
  if (vUv.y > level) discard;

  // 수면 부근 밝기 강조
  float surfaceGlow = smoothstep(level - 0.04, level, vUv.y);
  vec3 color = mix(uLiquidColor, uLiquidColor * 1.5 + 0.2, surfaceGlow);

  // 흔들림 shimmer
  float shimmer = sin(vUv.x * 20.0 + uTime * 3.0) * 0.03;
  color += shimmer;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 0.88);
}
