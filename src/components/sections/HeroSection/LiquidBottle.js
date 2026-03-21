import * as THREE from 'three';

const LIQUID_VERT = `
uniform float uTime;
uniform float uLevel;

varying vec2 vUv;

void main() {
  vUv = uv;
  float wave = sin(uv.x * 12.0 + uTime * 2.5) * 0.008 * uLevel;
  vec3 pos = position;
  pos.y += wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const LIQUID_FRAG = `
uniform float uTime;
uniform float uLevel;
uniform vec3  uLiquidColor;

varying vec2 vUv;

void main() {
  if (vUv.y > uLevel) discard;

  float surfaceGlow = smoothstep(uLevel - 0.04, uLevel, vUv.y);
  vec3 color = mix(uLiquidColor, min(uLiquidColor * 1.5 + 0.2, vec3(1.0)), surfaceGlow);

  float shimmer = sin(vUv.x * 20.0 + uTime * 3.0) * 0.03;
  color += shimmer;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 0.88);
}
`;

export default class LiquidBottle {
  constructor(scene) {
    this.scene = scene;
    this.liquidLevel = 0;    // 0 ~ 1
    this.targetLevel = 0;
    this.group = new THREE.Group();
    this.group.position.set(0, -1.8, 0);
    this.group.visible = false;
    scene.add(this.group);

    this._buildBottle();
    this._buildLiquid();
    this._buildFunnelLines(scene);
  }

  _buildBottle() {
    // 병 몸통
    const bodyGeo = new THREE.CylinderGeometry(0.38, 0.32, 1.4, 32, 1, true);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0.0,
      transmission: 0.9,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    this.group.add(body);

    // 병 바닥
    const bottomGeo = new THREE.CircleGeometry(0.32, 32);
    const bottomMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -0.7;
    this.group.add(bottom);

    // 병 넥
    const neckGeo = new THREE.CylinderGeometry(0.13, 0.3, 0.35, 24, 1, true);
    const neck = new THREE.Mesh(neckGeo, bodyMat);
    neck.position.y = 0.875;
    this.group.add(neck);

    // 병 마개
    const capGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.18, 20);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.15;
    this.group.add(cap);

    // 라벨 영역 (투명 사각형)
    const labelGeo = new THREE.PlaneGeometry(0.5, 0.55);
    const labelMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
    });
    this.label = new THREE.Mesh(labelGeo, labelMat);
    this.label.position.set(0, 0.05, 0.39);
    this.group.add(this.label);
  }

  _buildLiquid() {
    // 병 안 액체 플레인 (UV 기반으로 수위 제어)
    const geo = new THREE.CylinderGeometry(0.35, 0.3, 1.38, 32, 20, false);
    const mat = new THREE.ShaderMaterial({
      vertexShader: LIQUID_VERT,
      fragmentShader: LIQUID_FRAG,
      uniforms: {
        uTime:        { value: 0 },
        uLevel:       { value: 0 },
        uLiquidColor: { value: new THREE.Vector3(1.0, 0.85, 0.6) },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    this.liquid = new THREE.Mesh(geo, mat);
    this.liquid.position.y = 0;
    this.liquidMat = mat;
    this.group.add(this.liquid);
  }

  _buildFunnelLines(scene) {
    // 깔대기 라인
    const points = [
      new THREE.Vector3(-3, 1, 0),
      new THREE.Vector3(-0.15, -0.4, 0),
      new THREE.Vector3(0.15, -0.4, 0),
      new THREE.Vector3(3, 1, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints([
      points[0], points[1],
      points[2], points[3],
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0x1f1f1f,
      transparent: true,
      opacity: 0,
    });
    this.funnelLines = new THREE.LineSegments(geo, mat);
    this.funnelLinesMat = mat;
    scene.add(this.funnelLines);
  }

  show() {
    this.group.visible = true;
    // 깔대기 fade in
    let opacity = 0;
    const fade = setInterval(() => {
      opacity = Math.min(opacity + 0.04, 0.7);
      this.funnelLinesMat.opacity = opacity;
      if (opacity >= 0.7) clearInterval(fade);
    }, 16);
  }

  addLiquid(amount) {
    this.targetLevel = Math.min(this.targetLevel + amount, 1.0);
    // 색상 믹스 — 다양한 버블 색을 블렌딩
    const t = this.targetLevel;
    this.liquidMat.uniforms.uLiquidColor.value.set(
      0.9 + t * 0.1,
      0.7 + t * 0.15,
      0.4 + t * 0.2,
    );
  }

  update(time, dt) {
    // 수위 스무스 업데이트
    this.liquidLevel += (this.targetLevel - this.liquidLevel) * dt * 1.5;
    this.liquidMat.uniforms.uLevel.value = this.liquidLevel;
    this.liquidMat.uniforms.uTime.value = time;
  }

  getLevel() {
    return this.liquidLevel;
  }

  dispose() {
    this.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    if (this.funnelLines) {
      this.funnelLines.geometry.dispose();
      this.funnelLines.material.dispose();
      this.scene && this.scene.remove(this.funnelLines);
    }
  }
}
