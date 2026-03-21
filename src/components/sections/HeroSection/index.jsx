import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FluidInkSim from './FluidInkSim';
import styles from './HeroSection.module.css';

// R/G/B 채널 하나가 압도적으로 튀는 순수 잉크 컬러 (흰 느낌 없음)
const EMOTIONS = [
  { text: '따뜻한 차 한 잔',       color: [1.00, 0.38, 0.00], x: 25, y: 12 }, // 버닝 오렌지   R↑↑
  { text: '취준 성공',             color: [0.05, 0.95, 0.12], x: 72, y: 8  }, // 네온 그린      G↑↑
  { text: '완벽한 아침',           color: [0.00, 0.60, 1.00], x: 50, y: 22 }, // 일렉트릭 블루  B↑↑
  { text: '이불 밖은 위험해',      color: [0.08, 0.10, 1.00], x: 18, y: 38 }, // 퓨어 블루      B↑↑↑
  { text: '보고싶어',              color: [1.00, 0.04, 0.72], x: 80, y: 34 }, // 핫 마젠타      R↑↑
  { text: '특별한 데이트',         color: [1.00, 0.04, 0.18], x: 86, y: 52 }, // 비비드 레드    R↑↑↑
  { text: '새 옷 쇼핑',            color: [0.00, 0.92, 0.70], x: 55, y: 55 }, // 비비드 틸      G↑↑
  { text: '아무것도 하기 싫은 날', color: [0.50, 0.00, 1.00], x: 20, y: 68 }, // 비비드 바이올렛 B↑↑
  { text: '오늘은 칼퇴',           color: [0.18, 1.00, 0.05], x: 75, y: 73 }, // 네온 라임      G↑↑↑
  { text: '치킨 맛있다',           color: [1.00, 0.60, 0.00], x: 44, y: 85 }, // 딥 앰버        R↑↑
];

const FILL_RATE = 0.70; // fill units per second while hovering

export default function HeroSection() {
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);
  const simRef      = useRef(null);
  const rafRef      = useRef(null);
  const prevTimeRef = useRef(null);
  const hoverRef     = useRef(-1);
  const prevHoverRef = useRef(-1);
  const hoverSizeRef = useRef(EMOTIONS.map(() => 0));
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

  // 공통 초기화 (오버레이 닫기 + 상태 리셋)
  const _resetState = () => {
    setAllDone(false);
    fillsRef.current = EMOTIONS.map(() => 0);
    hoverSizeRef.current = EMOTIONS.map(() => 0);
    prevHoverRef.current = -1;
    doneRef.current = 0;
    labelRefs.current.forEach(el => {
      if (!el) return;
      el.style.setProperty('--fill', 0);
      el.classList.remove(styles.labelDone);
      delete el.dataset.done;
    });
    simRef.current?.clear();
  };

  // 배경 클릭 → 초기화 + 상단 이동
  const handleReset = () => {
    if (!overlayReady) return;
    _resetState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 서비스 둘러보기 클릭 → 초기화 + /how-it-works 라우트 이동
  const handleGoToService = (e) => {
    e.stopPropagation();
    if (!overlayReady) return;
    _resetState();
    navigate('/how-it-works');
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
      // 재호버 시 hover 크기 리셋 (fill 게이지는 유지)
      if (idx !== prevHoverRef.current) {
        if (idx >= 0) hoverSizeRef.current[idx] = 0;
        prevHoverRef.current = idx;
      }
      if (idx >= 0) {
        const fills = fillsRef.current;
        if (fills[idx] < 1) {
          fills[idx] = Math.min(fills[idx] + FILL_RATE * dt, 1);
          hoverSizeRef.current[idx] = Math.min(hoverSizeRef.current[idx] + FILL_RATE * dt, 1);
          const em = EMOTIONS[idx];
          const spread = 0.028 + fills[idx] * 0.049;
          const r = 0.35 + hoverSizeRef.current[idx] * 2.2;
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
          일상과 감정에 마우스를 올려 수면을 향으로 물들여보세요
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
            {overlayReady && <p className={styles.overlayHint} onClick={handleGoToService}>— 서비스 둘러보기 —</p>}
          </div>
        )}
      </div>
    </section>
  );
}
