import { useEffect, useRef, useState } from 'react';
import FluidInkSim from './FluidInkSim';
import styles from './HeroSection.module.css';

const EMOTIONS = [
  { text: '따뜻한 차 한 잔',       color: [1.0, 0.55, 0.20], x: 25, y: 12 },
  { text: '취준 성공',             color: [1.0, 0.87, 0.20], x: 72, y: 8  },
  { text: '완벽한 아침',           color: [0.90, 0.95, 0.60], x: 50, y: 22 },
  { text: '이불 밖은 위험해',      color: [0.50, 0.70, 1.0],  x: 18, y: 38 },
  { text: '보고싶어',              color: [1.0, 0.50, 0.70],  x: 80, y: 34 },
  { text: '특별한 데이트',         color: [1.0, 0.45, 0.58],  x: 86, y: 52 },
  { text: '새 옷 쇼핑',            color: [0.40, 0.88, 0.82], x: 55, y: 55 },
  { text: '아무것도 하기 싫은 날', color: [0.65, 0.60, 0.90], x: 20, y: 68 },
  { text: '오늘은 칼퇴',           color: [0.35, 0.85, 0.55], x: 75, y: 73 },
  { text: '치킨 맛있다',           color: [1.0,  0.68, 0.28], x: 44, y: 85 },
];

const FILL_RATE = 0.45; // fill units per second while hovering

export default function HeroSection() {
  const canvasRef   = useRef(null);
  const simRef      = useRef(null);
  const rafRef      = useRef(null);
  const prevTimeRef = useRef(null);
  const hoverRef    = useRef(-1);
  const fillsRef    = useRef(EMOTIONS.map(() => 0));
  const doneRef     = useRef(0);
  const labelRefs   = useRef([]);
  const [allDone, setAllDone] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);
  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768);

  // 애니메이션 완료(~3.2s) 후 클릭 활성화
  useEffect(() => {
    if (!allDone) { setOverlayReady(false); return; }
    const t = setTimeout(() => setOverlayReady(true), 3200);
    return () => clearTimeout(t);
  }, [allDone]);

  const handleReset = () => {
    if (!overlayReady) return;
    setAllDone(false);
    // fills + label DOM 초기화
    fillsRef.current = EMOTIONS.map(() => 0);
    doneRef.current = 0;
    labelRefs.current.forEach(el => {
      if (!el) return;
      el.style.setProperty('--fill', 0);
      el.classList.remove(styles.labelDone);
      delete el.dataset.done;
    });
    simRef.current?.clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isMobile.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let sim;
    try { sim = new FluidInkSim(canvas); }
    catch (e) { console.warn('WebGL unavailable', e); return; }
    simRef.current = sim;

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w > 0 && h > 0) sim.resize(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = prevTimeRef.current
        ? Math.min((now - prevTimeRef.current) / 1000, 0.05)
        : 0.016;
      prevTimeRef.current = now;

      const idx = hoverRef.current;
      if (idx >= 0) {
        const fills = fillsRef.current;
        if (fills[idx] < 1) {
          fills[idx] = Math.min(fills[idx] + FILL_RATE * dt, 1);
          const em = EMOTIONS[idx];
          const spread = 0.018 + fills[idx] * 0.028;
          const r = 0.5 + fills[idx] * 2.2;
          for (let k = 0; k < 5; k++) {
            sim.splat(
              em.x / 100 + (Math.random() - 0.5) * spread,
              em.y / 100 + (Math.random() - 0.5) * spread,
              em.color, r,
            );
          }
          // Direct DOM update — avoids 60fps React re-renders
          const el = labelRefs.current[idx];
          if (el) {
            el.style.setProperty('--fill', fills[idx]);
            if (fills[idx] >= 1 && !el.dataset.done) {
              el.dataset.done = '1';
              el.classList.add(styles.labelDone);
              doneRef.current++;
              if (doneRef.current === EMOTIONS.length) setAllDone(true);
            }
          }
        }
      }
      sim.step(dt);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      sim.dispose();
    };
  }, []);

  return (
    <section className={styles.hero} id="hero">

      {/* ── 텍스트 영역 — 수면 위 인트로 ── */}
      <div className={styles.textZone}>
        <span className={styles.eyebrow}>Scent × Emotion × AI</span>
        <h1 className={styles.headline}>
          당신의 하루를<br />
          <span className={styles.highlight}>향으로</span> 번역합니다.
        </h1>
        <p className={styles.sub}>
          감정에 마우스를 올려 수면을 물들여보세요.
        </p>
      </div>

      {/* ── 수면 캔버스 영역 ── */}
      <div className={styles.canvasZone}>
        {!isMobile.current ? (
          <canvas ref={canvasRef} className={styles.canvas} />
        ) : (
          <div className={styles.mobileWater} />
        )}

        {/* 감정 라벨 — 수면 위에 떠있음 */}
        {EMOTIONS.map((em, i) => (
          <div
            key={i}
            ref={el => labelRefs.current[i] = el}
            className={styles.emotionLabel}
            style={{
              left: `${em.x}%`,
              top:  `${em.y}%`,
              '--label-color': `rgb(${em.color.map(c => Math.round(c * 255)).join(',')})`,
              '--fill': 0,
              '--i': i,
            }}
            onMouseEnter={() => { hoverRef.current = i; }}
            onMouseLeave={() => { if (hoverRef.current === i) hoverRef.current = -1; }}
          >
            {em.text}
            <span className={styles.labelInk} />
          </div>
        ))}

        {/* 잔향 — 모든 감정이 채워지면 수면 위로 떠오름 */}
        {allDone && (
          <div
            className={`${styles.janhyangOverlay} ${overlayReady ? styles.overlayReady : ''}`}
            onClick={handleReset}
          >
            <p className={styles.janhyangText}>잔향</p>
            <p className={styles.janhyangSub}>모든 감정이 향으로 피어났습니다</p>
            {overlayReady && <p className={styles.overlayHint}>— 클릭하여 다시 시작 —</p>}
          </div>
        )}
      </div>
    </section>
  );
}
