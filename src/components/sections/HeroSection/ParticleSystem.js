import * as THREE from 'three';

export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.funnelTarget = new THREE.Vector3(0, -0.5, 0); // 깔대기 입구
    this.bottleTop = new THREE.Vector3(0, -2.2, 0);    // 병 입구
    this.onBottleReach = null;
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
      reachedFunnel: new Array(count).fill(false),
      reachedBottle: new Array(count).fill(false),
      life: 1,
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
      let allAtBottle = true;

      for (let i = 0; i < p.count; i++) {
        if (p.reachedBottle[i]) continue;
        allAtBottle = false;

        const px = pos[i * 3];
        const py = pos[i * 3 + 1];

        // 깔대기 영역 도달 여부
        if (!p.reachedFunnel[i] && py < this.funnelTarget.y) {
          p.reachedFunnel[i] = true;
          // 깔대기 → 병 방향으로 방향 전환
          const dx = this.bottleTop.x - px;
          p.velocities[i].x = dx * 0.04 + (Math.random() - 0.5) * 0.01;
          p.velocities[i].y = -0.035 - Math.random() * 0.02;
        }

        // 병 입구 도달
        if (py < this.bottleTop.y) {
          p.reachedBottle[i] = true;
          if (this.onBottleReach) this.onBottleReach();
          continue;
        }

        // 중력
        p.velocities[i].y -= 0.0008;

        pos[i * 3]     += p.velocities[i].x;
        pos[i * 3 + 1] += p.velocities[i].y;
      }

      p.geo.attributes.position.needsUpdate = true;

      if (allAtBottle) {
        p.life -= dt * 2;
        p.points.material.opacity = Math.max(0, p.life);
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
