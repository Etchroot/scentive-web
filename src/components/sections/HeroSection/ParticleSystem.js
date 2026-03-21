import * as THREE from 'three';

export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.funnelNeck = new THREE.Vector3(0, -0.5, 0); // 깔대기 입구 (여기서 페이드아웃)
  }

  spawn(origin, color, count = 28) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = origin.x + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = origin.z;

      colors[i * 3]     = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04 - 0.01,
        0,
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.particles.push({
      points,
      geo,
      velocities,
      count,
      reached: new Array(count).fill(false),
      life: 1,
      fading: false,
    });
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      if (p.life <= 0) {
        this.scene.remove(p.points);
        p.geo.dispose();
        p.points.material.dispose();
        return false;
      }

      const pos = p.geo.attributes.position.array;
      let allReached = true;

      for (let i = 0; i < p.count; i++) {
        if (p.reached[i]) continue;
        allReached = false;

        const py = pos[i * 3 + 1];

        // 깔대기 입구 도달 → 병목 방향으로 수렴
        if (py < this.funnelNeck.y) {
          p.reached[i] = true;
          continue;
        }

        // 깔대기 목으로 향하는 방향 보정
        if (py < 0) {
          const dx = this.funnelNeck.x - pos[i * 3];
          p.velocities[i].x += dx * 0.003;
        }

        // 중력
        p.velocities[i].y -= 0.0008;

        pos[i * 3]     += p.velocities[i].x;
        pos[i * 3 + 1] += p.velocities[i].y;
      }

      p.geo.attributes.position.needsUpdate = true;

      // 모두 도달 → 페이드아웃
      if (allReached) {
        p.life -= dt * 2.5;
        p.points.material.opacity = Math.max(0, p.life * 0.85);
      }

      return true;
    });
  }

  dispose() {
    this.particles.forEach(p => {
      this.scene.remove(p.points);
      p.geo.dispose();
      p.points.material.dispose();
    });
    this.particles = [];
  }
}
