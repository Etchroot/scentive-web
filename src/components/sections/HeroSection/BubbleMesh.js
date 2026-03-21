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

export default class BubbleMesh {
  constructor(scene, count = EMOTION_BUBBLES.length) {
    this.count = count;
    this.fills = new Array(count).fill(0);
    this.hovers = new Array(count).fill(0);
    this.scales = new Array(count).fill(1);
    this.completed = new Array(count).fill(false);
    this.positions = [];
    this.velocities = [];
    this.phases = [];

    this._initPositions();
    this._createMeshes(scene);
  }

  _initPositions() {
    for (let i = 0; i < this.count; i++) {
      this.positions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 2,
      ));
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.003,
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

      // 부유 운동
      const phase = this.phases[i];
      mesh.position.x = this.positions[i].x + Math.sin(time * 0.4 + phase) * 0.15;
      mesh.position.y = this.positions[i].y + Math.cos(time * 0.3 + phase * 1.3) * 0.12;

      // 속도 적용
      this.positions[i].x += this.velocities[i].x;
      this.positions[i].y += this.velocities[i].y;

      // 경계 반사
      if (Math.abs(this.positions[i].x) > 7) this.velocities[i].x *= -1;
      if (Math.abs(this.positions[i].y) > 4.5) this.velocities[i].y *= -1;

      // 유니폼 업데이트
      const mat = this.materials[i];
      mat.uniforms.uTime.value = time;
      mat.uniforms.uFill.value = this.fills[i];
      mat.uniforms.uHover.value = this.hovers[i];
      mat.uniforms.uScale.value = this.scales[i];
    });
  }

  setHover(index, isHover) {
    this.hovers[index] = isHover ? 1 : 0;
  }

  addFill(index, amount) {
    this.fills[index] = Math.min(this.fills[index] + amount, 1);
    return this.fills[index];
  }

  startCondense(index) {
    this.completed[index] = true;
  }

  getMeshes() {
    return this.meshes;
  }

  getAllCompleted() {
    return this.completed.every(Boolean);
  }
}
