import * as THREE from 'three';

const BUBBLE_VERT = `
uniform float uTime;
uniform float uFill;
uniform float uHover;
uniform float uScale;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  float scaleBoost = 1.0 + uHover * 0.04;
  vec3 displaced = position * scaleBoost * uScale;
  float noise = sin(position.x * 8.0 + uTime * 2.0) * cos(position.y * 8.0 + uTime * 1.5) * 0.015;
  displaced += normal * noise * uFill;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const BUBBLE_FRAG = `
uniform float uTime;
uniform float uFill;
uniform float uHover;
uniform vec3  uFluidColor;
varying vec3 vNormal;
varying vec3 vPosition;
vec3 iridescent(vec3 n, float t) {
  float f = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.5);
  vec3 c = vec3(0.0);
  c += vec3(0.95, 0.85, 1.0) * (sin(f * 6.0 + t * 0.8) * 0.5 + 0.5);
  c += vec3(1.0, 0.9, 0.8) * (cos(f * 4.0 - t * 0.5) * 0.3 + 0.3);
  c += vec3(0.8, 1.0, 0.95) * (sin(f * 8.0 + t * 1.2) * 0.2 + 0.2);
  return clamp(c * 0.6 + 0.4, 0.0, 1.0);
}
float swirl(vec3 p, float t) {
  return sin(p.x * 5.0 + t) * cos(p.y * 5.0 - t * 0.7) * sin(p.z * 5.0 + t * 0.5);
}
void main() {
  vec3 normal = normalize(vNormal);
  vec3 iriColor = iridescent(normal, uTime);
  float sw = swirl(vPosition, uTime * 1.5) * 0.5 + 0.5;
  vec3 fluidColor = mix(uFluidColor, min(uFluidColor * 1.4, vec3(1.0)), sw);
  vec3 finalColor = mix(iriColor, fluidColor, uFill);
  float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  finalColor += vec3(1.0) * fresnel * 0.15;
  float alpha = clamp(0.35 + uFill * 0.55 + fresnel * 0.4, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const EMOTION_BUBBLES = [
  { text: '따뜻한 차 한 잔',       color: [1.0, 0.55, 0.2],  radius: 52 },
  { text: '취준 성공',             color: [1.0, 0.87, 0.2],  radius: 44 },
  { text: '완벽한 아침',           color: [0.9, 0.95, 0.6],  radius: 48 },
  { text: '이불 밖은 위험해',      color: [0.6, 0.75, 1.0],  radius: 56 },
  { text: '보고싶어',              color: [1.0, 0.6,  0.75], radius: 46 },
  { text: '새 옷 쇼핑',            color: [0.5, 0.9,  0.85], radius: 42 },
  { text: '아무것도 하기 싫은 날', color: [0.7, 0.65, 0.9],  radius: 50 },
  { text: '오늘은 칼퇴',           color: [0.4, 0.85, 0.6],  radius: 40 },
  { text: '치킨 맛있다',           color: [1.0, 0.7,  0.3],  radius: 44 },
  { text: '특별한 데이트',         color: [1.0, 0.5,  0.6],  radius: 48 },
];

// 깔대기 경계 (HeroScene._buildGlassFunnel과 동일)
const TOP_Y      =  2.2;
const RECT_BOT_Y =  0.6;
const NECK_TOP_Y = -2.0;
const TOP_X      =  3.0;
const NECK_X     =  0.35;
const BUBBLE_BOT_Y = -1.5; // 버블이 내려갈 수 있는 최저점 (목 위)

// y 위치에 따른 깔대기 내부 x 한계
function funnelXLimit(y) {
  if (y >= RECT_BOT_Y) return TOP_X;
  // RECT_BOT_Y ~ NECK_TOP_Y 사이 선형 보간
  const t = Math.max(0, Math.min(1, (y - NECK_TOP_Y) / (RECT_BOT_Y - NECK_TOP_Y)));
  return NECK_X + (TOP_X - NECK_X) * t;
}

export default class BubbleMesh {
  constructor(scene, count = EMOTION_BUBBLES.length) {
    this.count = count;
    this.fills     = new Array(count).fill(0);
    this.hovers    = new Array(count).fill(0);
    this.scales    = new Array(count).fill(1);
    this.completed = new Array(count).fill(false);
    this.positions = [];
    this.velocities = [];
    this.phases = [];
    this._initPositions();
    this._createMeshes(scene);
  }

  _initPositions() {
    for (let i = 0; i < this.count; i++) {
      // 깔대기 몸통 안에 고르게 배치
      const y = BUBBLE_BOT_Y + Math.random() * (TOP_Y - 0.3 - BUBBLE_BOT_Y);
      const xMax = funnelXLimit(y) * 0.72;
      const x = (Math.random() - 0.5) * 2 * xMax;
      this.positions.push(new THREE.Vector3(x, y, (Math.random() - 0.5) * 0.4));
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.005,
        (Math.random() - 0.5) * 0.003,
        0,
      ));
      this.phases.push(Math.random() * Math.PI * 2);
    }
  }

  _createMeshes(scene) {
    this.meshes = [];
    this.materials = [];
    EMOTION_BUBBLES.forEach((bubble, i) => {
      const r = bubble.radius / 100;
      const geo = new THREE.SphereGeometry(r, 32, 32);
      const mat = new THREE.ShaderMaterial({
        vertexShader: BUBBLE_VERT,
        fragmentShader: BUBBLE_FRAG,
        uniforms: {
          uTime:       { value: 0 },
          uFill:       { value: 0 },
          uHover:      { value: 0 },
          uScale:      { value: 1 },
          uFluidColor: { value: new THREE.Vector3(...bubble.color) },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(this.positions[i]);
      mesh.userData.index = i;
      mesh.userData.radius = r;
      scene.add(mesh);
      this.meshes.push(mesh);
      this.materials.push(mat);
    });
  }

  update(time, dt) {
    this.meshes.forEach((mesh, i) => {
      if (this.completed[i]) return;

      const pos = this.positions[i];
      const vel = this.velocities[i];
      const r   = EMOTION_BUBBLES[i].radius / 100;
      const phase = this.phases[i];

      // 부유 운동
      mesh.position.x = pos.x + Math.sin(time * 0.4 + phase) * 0.12;
      mesh.position.y = pos.y + Math.cos(time * 0.3 + phase * 1.3) * 0.10;

      pos.x += vel.x;
      pos.y += vel.y;

      // 상단 벽
      if (pos.y + r > TOP_Y - 0.1) {
        pos.y = TOP_Y - 0.1 - r;
        vel.y = -Math.abs(vel.y) * 0.38;
      }
      // 하단 벽
      if (pos.y - r < BUBBLE_BOT_Y) {
        pos.y = BUBBLE_BOT_Y + r;
        vel.y = Math.abs(vel.y) * 0.38;
      }

      // 깔대기 사선 벽
      const xLim = funnelXLimit(pos.y) - r * 0.55;
      if (pos.x > xLim) {
        pos.x = xLim;
        vel.x = -Math.abs(vel.x) * 0.42;
      }
      if (pos.x < -xLim) {
        pos.x = -xLim;
        vel.x =  Math.abs(vel.x) * 0.42;
      }

      // 미세 랜덤 (정체 방지)
      vel.x += (Math.random() - 0.5) * 0.0007;
      vel.y += (Math.random() - 0.5) * 0.0004;

      const maxV = 0.010;
      vel.x = Math.max(-maxV, Math.min(maxV, vel.x));
      vel.y = Math.max(-maxV, Math.min(maxV, vel.y));

      const mat = this.materials[i];
      mat.uniforms.uTime.value  = time;
      mat.uniforms.uFill.value  = this.fills[i];
      mat.uniforms.uHover.value = this.hovers[i];
      mat.uniforms.uScale.value = this.scales[i];
    });
  }

  setHover(index, isHover)  { this.hovers[index] = isHover ? 1 : 0; }
  addFill(index, amount)    { this.fills[index] = Math.min(this.fills[index] + amount, 1); return this.fills[index]; }
  startCondense(index)      { this.completed[index] = true; }
  getMeshes()               { return this.meshes; }
  getAllCompleted()          { return this.completed.every(Boolean); }
}
