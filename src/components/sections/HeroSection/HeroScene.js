import * as THREE from 'three';
import BubbleMesh, { EMOTION_BUBBLES } from './BubbleMesh';
import ParticleSystem from './ParticleSystem';

export default class HeroScene {
  constructor(canvas, onAllCompleted) {
    this.canvas = canvas;
    this.onAllCompleted = onAllCompleted;
    this.time = 0;
    this.lastTime = performance.now();
    this.mouse = new THREE.Vector2(9999, 9999);
    this.raycaster = new THREE.Raycaster();
    this.hoveredIndex = -1;
    this.fillSpeed = 0.35;
    this.condensing = new Set();
    this.allDone = false;

    this._init();
    this._bindEvents();
    this._animate();
  }

  _init() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0xffffff, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.camera.position.z = 8;

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 5);
    this.scene.add(ambient, dir);

    this._buildGlassFunnel();
    this.bubbleMesh = new BubbleMesh(this.scene, EMOTION_BUBBLES.length);
    this.particleSystem = new ParticleSystem(this.scene);
    this._buildFogSprite();
  }

  // ── 유리 깔대기 (Canvas2D 텍스처) ──────────────────────────────
  _buildGlassFunnel() {
    // 깔대기 world 좌표 정의
    const TOP_Y      =  2.2;
    const RECT_BOT_Y =  0.6;   // 직사각형 → 사다리꼴 시작 y
    const NECK_TOP_Y = -2.0;   // 사다리꼴 끝 / 목 시작 y
    const NECK_BOT_Y = -2.8;   // 목 바닥 y
    const TOP_X      =  3.0;   // 상단 반폭
    const NECK_X     =  0.35;  // 목 반폭

    // 텍스처 캔버스 — world bbox 보다 약간 크게
    const WX_MIN = -3.6, WX_MAX = 3.6;
    const WY_MAX =  2.5, WY_MIN = -3.1;
    const WW = WX_MAX - WX_MIN;
    const WH = WY_MAX - WY_MIN;
    const CW = 720, CH = Math.round(CW * WH / WW);

    const mapX = wx => (wx - WX_MIN) / WW * CW;
    const mapY = wy => (WY_MAX - wy) / WH * CH;

    const cv = document.createElement('canvas');
    cv.width = CW; cv.height = CH;
    const ctx = cv.getContext('2d');

    // 깔대기 경로
    const p = new Path2D();
    p.moveTo(mapX(-TOP_X), mapY(TOP_Y));
    p.lineTo(mapX( TOP_X), mapY(TOP_Y));
    p.lineTo(mapX( TOP_X), mapY(RECT_BOT_Y));
    p.lineTo(mapX( NECK_X), mapY(NECK_TOP_Y));
    p.lineTo(mapX( NECK_X), mapY(NECK_BOT_Y));
    p.lineTo(mapX(-NECK_X), mapY(NECK_BOT_Y));
    p.lineTo(mapX(-NECK_X), mapY(NECK_TOP_Y));
    p.lineTo(mapX(-TOP_X), mapY(RECT_BOT_Y));
    p.closePath();

    // ─ 클립 영역 안에 유리 레이어 합성 ─
    ctx.save();
    ctx.clip(p);

    // 기본 유리 색 (가로 그라데이션)
    const gMain = ctx.createLinearGradient(0, 0, CW, 0);
    gMain.addColorStop(0.00, 'rgba(170,210,248,0.58)');
    gMain.addColorStop(0.07, 'rgba(240,250,255,0.42)');
    gMain.addColorStop(0.28, 'rgba(215,232,252,0.09)');
    gMain.addColorStop(0.72, 'rgba(215,232,252,0.09)');
    gMain.addColorStop(0.93, 'rgba(205,228,250,0.28)');
    gMain.addColorStop(1.00, 'rgba(150,195,238,0.55)');
    ctx.fillStyle = gMain;
    ctx.fillRect(0, 0, CW, CH);

    // 왼쪽 반사 하이라이트
    const gHL = ctx.createLinearGradient(0, 0, 52, 0);
    gHL.addColorStop(0, 'rgba(255,255,255,0.32)');
    gHL.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gHL;
    ctx.fillRect(0, 0, 52, CH);

    // 오른쪽 그림자
    const gSH = ctx.createLinearGradient(CW - 48, 0, CW, 0);
    gSH.addColorStop(0, 'rgba(0,20,60,0)');
    gSH.addColorStop(1, 'rgba(0,20,60,0.10)');
    ctx.fillStyle = gSH;
    ctx.fillRect(CW - 48, 0, 48, CH);

    // 목(neck) 빛 집중 효과
    const neckCX = mapX(0), neckCY = mapY((NECK_TOP_Y + NECK_BOT_Y) / 2);
    const gNeck = ctx.createRadialGradient(neckCX, neckCY + 20, 5, neckCX, neckCY, 90);
    gNeck.addColorStop(0, 'rgba(165,218,255,0.40)');
    gNeck.addColorStop(1, 'rgba(165,218,255,0)');
    ctx.fillStyle = gNeck;
    ctx.fillRect(0, 0, CW, CH);

    // 세로 내부 반사 선 (왼쪽 벽 안쪽)
    const gVR = ctx.createLinearGradient(0, 0, 0, CH);
    gVR.addColorStop(0, 'rgba(255,255,255,0.12)');
    gVR.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = gVR;
    ctx.fillRect(mapX(-TOP_X) + 14, 0, 10, CH);

    ctx.restore();

    // 테두리 (유리 가장자리)
    ctx.strokeStyle = 'rgba(95,152,210,0.55)';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke(p);

    // THREE.js PlaneGeometry에 텍스처 적용
    const tex = new THREE.CanvasTexture(cv);
    const geo = new THREE.PlaneGeometry(WW, WH);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, (WY_MAX + WY_MIN) / 2, -1.0);
    this.scene.add(mesh);

    // 버블 제한용으로 저장
    this.funnelBounds = { TOP_Y, RECT_BOT_Y, NECK_TOP_Y, NECK_BOT_Y, TOP_X, NECK_X };
  }

  _buildFogSprite() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.08, depthWrite: false });
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
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
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
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, mouseWorld);

    this.fogSprite.position.lerp(mouseWorld, 0.08);
    this.bubbleMesh.update(this.time, dt);

    const meshes = this.bubbleMesh.getMeshes();
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (this.hoveredIndex !== -1) this.bubbleMesh.setHover(this.hoveredIndex, false);
    this.hoveredIndex = -1;

    if (intersects.length > 0 && !this.allDone) {
      const hit = intersects[0].object;
      const idx = hit.userData.index;
      if (!this.condensing.has(idx) && !this.bubbleMesh.completed[idx]) {
        this.hoveredIndex = idx;
        this.bubbleMesh.setHover(idx, true);
        this.canvas.style.cursor = 'pointer';
        const fill = this.bubbleMesh.addFill(idx, dt * this.fillSpeed);
        if (fill >= 1.0) this._triggerCondense(idx, hit.position.clone());
      }
    } else {
      this.canvas.style.cursor = 'default';
    }

    this.particleSystem.update(dt);

    if (!this.allDone && this.bubbleMesh.getAllCompleted()) {
      this.allDone = true;
      setTimeout(() => this.onAllCompleted?.(), 800);
    }
  }

  _triggerCondense(idx, origin) {
    this.condensing.add(idx);
    this.bubbleMesh.startCondense(idx);
    this.particleSystem.spawn(origin, EMOTION_BUBBLES[idx].color, 28);
    const mesh = this.bubbleMesh.getMeshes()[idx];
    let s = 1.0;
    const shrink = setInterval(() => {
      s -= 0.06;
      if (s <= 0) { clearInterval(shrink); mesh.visible = false; }
      else mesh.scale.setScalar(s);
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
