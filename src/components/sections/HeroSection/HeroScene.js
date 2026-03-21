import * as THREE from 'three';
import BubbleMesh, { EMOTION_BUBBLES } from './BubbleMesh';
import ParticleSystem from './ParticleSystem';

// Funnel world constants — must match BubbleMesh.js
const FUNNEL = {
  TOP_Y:      4.4,   // rect top
  RECT_BOT_Y: 0.8,   // rect → 45° taper starts here
  NECK_TOP_Y: -0.72, // taper ends (45°: height = TOP_X - NECK_X = 1.52)
  NECK_BOT_Y: -0.92, // sharp tip bottom
  TOP_X:      1.6,   // rect half-width
  NECK_X:     0.08,  // neck half-width (very narrow)
};

export default class HeroScene {
  constructor(canvas, onAllCompleted, onDropReachBottle) {
    this.canvas = canvas;
    this.onAllCompleted = onAllCompleted;
    this.onDropReachBottle = onDropReachBottle;
    this.time = 0;
    this.lastTime = performance.now();
    this.mouse = new THREE.Vector2(9999, 9999);
    this.raycaster = new THREE.Raycaster();
    this.hoveredIndex = -1;
    this.fillSpeed = 0.35;
    this.condensing = new Set();
    this.allDone = false;
    this.droplets = [];

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
    this._adjustCamera(w, h);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 5);
    this.scene.add(ambient, dir);

    this._buildGlassFunnel();
    this.bubbleMesh = new BubbleMesh(this.scene, EMOTION_BUBBLES.length);
    this.particleSystem = new ParticleSystem(this.scene);
    this._buildFogSprite();
  }

  // Camera z adjusts so the whole funnel always fits the viewport
  _adjustCamera(w, h) {
    const aspect = w / h;
    this.camera.aspect = aspect;
    const tanHalfFov = Math.tan(27.5 * Math.PI / 180);
    const z_w = (FUNNEL.TOP_X * 1.3) / (tanHalfFov * aspect);  // fit width
    const z_h = (FUNNEL.TOP_Y * 1.08) / tanHalfFov;             // fit height
    this.camera.position.z = Math.max(5, Math.min(22, Math.max(z_w, z_h)));
    this.camera.updateProjectionMatrix();
  }

  _buildGlassFunnel() {
    const { TOP_Y, RECT_BOT_Y, NECK_TOP_Y, NECK_BOT_Y, TOP_X, NECK_X } = FUNNEL;

    const WX_MIN = -2.2, WX_MAX = 2.2;
    const WY_MAX = 4.8,  WY_MIN = -1.1;
    const WW = WX_MAX - WX_MIN;
    const WH = WY_MAX - WY_MIN;
    const CW = 720, CH = Math.round(CW * WH / WW);

    const mapX = wx => (wx - WX_MIN) / WW * CW;
    const mapY = wy => (WY_MAX - wy) / WH * CH;

    const cv = document.createElement('canvas');
    cv.width = CW; cv.height = CH;
    const ctx = cv.getContext('2d');

    // Funnel path: wide rect top → 45° taper → sharp neck
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

    ctx.save();
    ctx.clip(p);

    // Main glass body (horizontal gradient)
    const gMain = ctx.createLinearGradient(0, 0, CW, 0);
    gMain.addColorStop(0.00, 'rgba(170,210,248,0.58)');
    gMain.addColorStop(0.10, 'rgba(240,250,255,0.40)');
    gMain.addColorStop(0.30, 'rgba(215,232,252,0.07)');
    gMain.addColorStop(0.70, 'rgba(215,232,252,0.07)');
    gMain.addColorStop(0.90, 'rgba(205,228,250,0.30)');
    gMain.addColorStop(1.00, 'rgba(150,195,238,0.55)');
    ctx.fillStyle = gMain;
    ctx.fillRect(0, 0, CW, CH);

    // Left wall inner highlight
    const lx = mapX(-TOP_X);
    const gHL = ctx.createLinearGradient(lx, 0, lx + 36, 0);
    gHL.addColorStop(0, 'rgba(255,255,255,0.30)');
    gHL.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gHL;
    ctx.fillRect(lx, 0, 36, CH);

    // Right wall inner shadow
    const rx = mapX(TOP_X);
    const gSH = ctx.createLinearGradient(rx - 36, 0, rx, 0);
    gSH.addColorStop(0, 'rgba(0,20,60,0)');
    gSH.addColorStop(1, 'rgba(0,20,60,0.14)');
    ctx.fillStyle = gSH;
    ctx.fillRect(rx - 36, 0, 36, CH);

    // Neck light concentration glow
    const neckCX = mapX(0), neckCY = mapY((NECK_TOP_Y + NECK_BOT_Y) / 2);
    const gNeck = ctx.createRadialGradient(neckCX, neckCY, 3, neckCX, neckCY, 65);
    gNeck.addColorStop(0, 'rgba(165,218,255,0.50)');
    gNeck.addColorStop(1, 'rgba(165,218,255,0)');
    ctx.fillStyle = gNeck;
    ctx.fillRect(0, 0, CW, CH);

    // Vertical inner reflection strip
    const gVR = ctx.createLinearGradient(0, 0, 0, CH);
    gVR.addColorStop(0, 'rgba(255,255,255,0.13)');
    gVR.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = gVR;
    ctx.fillRect(lx + 14, 0, 8, CH);

    ctx.restore();

    // Glass edge stroke
    ctx.strokeStyle = 'rgba(95,152,210,0.55)';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke(p);

    const tex = new THREE.CanvasTexture(cv);
    const geo = new THREE.PlaneGeometry(WW, WH);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, (WY_MAX + WY_MIN) / 2, -1.0);
    this.scene.add(mesh);
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
      this._adjustCamera(w, h);
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
    this._updateDroplets(dt);

    if (!this.allDone && this.bubbleMesh.getAllCompleted()) {
      this.allDone = true;
      setTimeout(() => this.onAllCompleted?.(), 800);
    }
  }

  // Bubble shrinks → becomes a droplet that slides down the funnel
  _triggerCondense(idx, origin) {
    this.condensing.add(idx);
    this.bubbleMesh.startCondense(idx);
    const mesh = this.bubbleMesh.getMeshes()[idx];
    const bubbleR = EMOTION_BUBBLES[idx].radius / 100;
    const color = EMOTION_BUBBLES[idx].color;
    let s = 1.0;
    const shrink = setInterval(() => {
      s -= 0.07;
      if (s <= 0) {
        clearInterval(shrink);
        mesh.visible = false;
        this._spawnDroplet(origin.clone(), color, bubbleR * 0.4);
      } else {
        mesh.scale.setScalar(s);
      }
    }, 16);
  }

  _spawnDroplet(pos, color, radius) {
    const geo = new THREE.SphereGeometry(radius, 14, 10);
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color[0], color[1], color[2]),
      transparent: true,
      opacity: 0.85,
      shininess: 140,
      specular: new THREE.Color(0.8, 0.9, 1.0),
    });
    const drop = new THREE.Mesh(geo, mat);
    drop.position.copy(pos);
    this.scene.add(drop);
    this.droplets.push({ mesh: drop, vx: 0, vy: 0 });
  }

  // Gravity + funnel wall following (45° taper) → falls into bottle
  _updateDroplets(dt) {
    if (!this.droplets.length) return;

    const GRAVITY = 7;
    const { TOP_X, NECK_X, RECT_BOT_Y, NECK_TOP_Y, NECK_BOT_Y } = FUNNEL;
    const funnelX = y => {
      if (y >= RECT_BOT_Y) return TOP_X;
      if (y <= NECK_TOP_Y) return NECK_X;
      const t = (y - NECK_TOP_Y) / (RECT_BOT_Y - NECK_TOP_Y);
      return NECK_X + (TOP_X - NECK_X) * t;
    };

    this.droplets = this.droplets.filter(d => {
      d.vy -= GRAVITY * dt;
      d.vx *= 0.96;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;

      const pos = d.mesh.position;
      const xLim = funnelX(pos.y);

      // Hit wall → redirect along 45° wall surface
      if (pos.x > xLim) {
        pos.x = xLim;
        const spd = Math.hypot(d.vx, d.vy);
        d.vx = -spd * 0.707;
        d.vy = -spd * 0.707;
      } else if (pos.x < -xLim) {
        pos.x = -xLim;
        const spd = Math.hypot(d.vx, d.vy);
        d.vx = spd * 0.707;
        d.vy = -spd * 0.707;
      }

      // Fell through neck into bottle
      if (pos.y < NECK_BOT_Y - 0.6) {
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        this.onDropReachBottle?.();
        return false;
      }
      return true;
    });
  }

  dispose() {
    cancelAnimationFrame(this._rafId);
    const el = this.canvas.parentElement;
    if (el) el.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);
    this.droplets.forEach(d => {
      this.scene.remove(d.mesh);
      d.mesh.geometry.dispose();
      d.mesh.material.dispose();
    });
    this.particleSystem.dispose();
    this.renderer.dispose();
  }
}
