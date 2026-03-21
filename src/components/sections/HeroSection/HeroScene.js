import * as THREE from 'three';
import BubbleMesh, { EMOTION_BUBBLES } from './BubbleMesh';
import ParticleSystem from './ParticleSystem';
import LiquidBottle from './LiquidBottle';

export default class HeroScene {
  constructor(canvas, onAllCompleted) {
    this.canvas = canvas;
    this.onAllCompleted = onAllCompleted;
    this.time = 0;
    this.lastTime = performance.now();
    this.mouse = new THREE.Vector2(9999, 9999);
    this.raycaster = new THREE.Raycaster();
    this.hoveredIndex = -1;
    this.fillSpeed = 0.35; // hover 유지 시 초당 채우기 속도
    this.condensing = new Set();
    this.allDone = false;

    this._init();
    this._bindEvents();
    this._animate();
  }

  _init() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // 렌더러
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0xffffff, 0);

    // 씬 & 카메라
    this.scene = new THREE.Scene();
    const aspect = w / h;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this.camera.position.z = 8;

    // 조명
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 5);
    this.scene.add(ambient, dir);

    // 버블
    this.bubbleMesh = new BubbleMesh(this.scene, EMOTION_BUBBLES.length);

    // 파티클 시스템
    this.particleSystem = new ParticleSystem(this.scene);
    this.particleSystem.onBottleReach = () => {
      this.liquidBottle.addLiquid(1 / EMOTION_BUBBLES.length);
    };

    // 향수병
    this.liquidBottle = new LiquidBottle(this.scene);

    // 안개 스프라이트 (마우스 trailing)
    this._buildFogSprite();
  }

  _buildFogSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.08, depthWrite: false });
    this.fogSprite = new THREE.Sprite(mat);
    this.fogSprite.scale.set(2.5, 2.5, 1);
    this.scene.add(this.fogSprite);
  }

  _bindEvents() {
    const el = this.canvas.parentElement;

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    this._onResize = () => {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    el.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('resize', this._onResize);
  }

  _animate() {
    this._rafId = requestAnimationFrame(() => this._animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.time += dt;

    this._update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _update(dt) {
    // 마우스 월드 좌표 (z=0 평면)
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, mouseWorld);

    // 안개 스프라이트 위치
    this.fogSprite.position.lerp(mouseWorld, 0.08);

    // 버블 업데이트
    this.bubbleMesh.update(this.time, dt);

    // 레이캐스터 히트 테스트
    const meshes = this.bubbleMesh.getMeshes();
    const intersects = this.raycaster.intersectObjects(meshes, false);

    // 이전 hover 초기화
    if (this.hoveredIndex !== -1) {
      this.bubbleMesh.setHover(this.hoveredIndex, false);
    }
    this.hoveredIndex = -1;

    if (intersects.length > 0 && !this.allDone) {
      const hit = intersects[0].object;
      const idx = hit.userData.index;

      if (!this.condensing.has(idx) && !this.bubbleMesh.completed[idx]) {
        this.hoveredIndex = idx;
        this.bubbleMesh.setHover(idx, true);
        this.canvas.style.cursor = 'pointer';

        const fill = this.bubbleMesh.addFill(idx, dt * this.fillSpeed);

        if (fill >= 1.0) {
          this._triggerCondense(idx, hit.position.clone());
        }
      }
    } else {
      this.canvas.style.cursor = 'default';
    }

    // 파티클 업데이트
    this.particleSystem.update(dt);

    // 향수병 업데이트
    this.liquidBottle.update(this.time, dt);

    // 모든 버블 완료 체크
    if (!this.allDone && this.bubbleMesh.getAllCompleted()) {
      this.allDone = true;
      setTimeout(() => {
        this.onAllCompleted && this.onAllCompleted();
      }, 800);
    }
  }

  _triggerCondense(idx, origin) {
    this.condensing.add(idx);
    this.bubbleMesh.startCondense(idx);

    // 첫 버블 완료 시 병 show
    if (!this.liquidBottle.group.visible) {
      this.liquidBottle.show();
    }

    // 파티클 스폰
    const bubble = EMOTION_BUBBLES[idx];
    this.particleSystem.spawn(origin, bubble.color, 28);

    // 버블 수축 애니메이션
    const mesh = this.bubbleMesh.getMeshes()[idx];
    let s = 1.0;
    const shrink = setInterval(() => {
      s -= 0.06;
      if (s <= 0) {
        clearInterval(shrink);
        mesh.visible = false;
      } else {
        mesh.scale.setScalar(s);
      }
    }, 16);
  }

  dispose() {
    cancelAnimationFrame(this._rafId);
    const el = this.canvas.parentElement;
    if (el) el.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);
    this.particleSystem.dispose();
    this.renderer.dispose();
  }
}
