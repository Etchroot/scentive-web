import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 14;

// 다양한 색상 팔레트 — 향기로운 느낌
const COLORS = [
  [212, 165, 116],  // warm brown
  [232, 196, 160],  // light sand
  [255, 198, 43],   // accent gold
  [255, 221, 130],  // point yellow
  [180, 140, 100],  // muted copper
  [221, 123, 187],  // soft pink
  [90, 146, 44],    // herb green
  [76, 120, 148],   // dusty blue
  [234, 139, 91],   // coral
  [168, 130, 200],  // lavender
  [200, 88, 88],    // muted red
  [100, 180, 160],  // teal
];

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // 입자 초기화 — 화면 전체에 랜덤 배치
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const color = COLORS[i % COLORS.length];
      return {
        x: Math.random() * canvas.width,
        y: 56 + Math.random() * (canvas.height - 56),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 8 + 3,          // 3~11px
        color,
        alpha: 0.25 + Math.random() * 0.35,   // 0.25~0.6
      };
    });

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const loop = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseActive = mx > -999;

      for (const p of particlesRef.current) {
        if (mouseActive) {
          // 거리 무관 인력 — 항상 마우스를 향해 끌려감
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            // 거리에 반비례하는 인력 (가까울수록 강함, 멀어도 0이 아님)
            const force = 0.6 / (1 + dist * 0.004);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // 자체 부유 (입자끼리 똑같이 뭉치지 않도록)
        const t = Date.now() * 0.001;
        p.vx += Math.sin(t * 0.7 + p.size * 10) * 0.04;
        p.vy += Math.cos(t * 0.6 + p.alpha * 30) * 0.04;

        // 속도 감쇠
        p.vx *= 0.93;
        p.vy *= 0.93;

        p.x += p.vx;
        p.y += p.vy;

        // 경계 반사 (상단은 네비바 56px 아래부터)
        const topBound = 56;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > width) { p.x = width; p.vx = -Math.abs(p.vx); }
        if (p.y < topBound) { p.y = topBound; p.vy = Math.abs(p.vy); }
        if (p.y > height) { p.y = height; p.vy = -Math.abs(p.vy); }

        // 부드러운 원형 그라디언트로 그리기
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`);
        grad.addColorStop(1, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 가까운 입자끼리 연결선
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(200,170,130,${0.1 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
