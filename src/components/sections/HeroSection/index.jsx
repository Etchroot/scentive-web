import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FluidInkSim from './FluidInkSim';
import SeoHead from '../../common/SeoHead';
import styles from './HeroSection.module.css';

// 비-텍스트 데이터 (WebGL 컬러, 위치, 향 색상) — 번역 불필요
const EMOTION_META = [
  { color: [1.00, 0.38, 0.00], x: 25, y: 12, scentColor: '#FFF7E1' },
  { color: [0.05, 0.95, 0.12], x: 72, y: 8,  scentColor: '#FFAD00' },
  { color: [0.00, 0.60, 1.00], x: 50, y: 22, scentColor: '#EFEFEF' },
  { color: [0.08, 0.10, 1.00], x: 18, y: 38, scentColor: '#FFE1D6' },
  { color: [1.00, 0.04, 0.72], x: 80, y: 34, scentColor: '#FFC8B6' },
  { color: [1.00, 0.04, 0.18], x: 86, y: 52, scentColor: '#FFE2EE' },
  { color: [0.00, 0.92, 0.70], x: 55, y: 55, scentColor: '#B0EBEC' },
  { color: [0.50, 0.00, 1.00], x: 20, y: 68, scentColor: '#CACACA' },
  { color: [0.18, 1.00, 0.05], x: 75, y: 73, scentColor: '#C0E5D1' },
  { color: [1.00, 0.60, 0.00], x: 44, y: 85, scentColor: '#FFA487' },
];

const FILL_RATE = 0.70; // fill units per second while hovering

export default function HeroSection() {
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();
  const canvasRef   = useRef(null);
  const simRef      = useRef(null);
  const rafRef      = useRef(null);
  const prevTimeRef = useRef(null);
  const hoverRef     = useRef(-1);
  const prevHoverRef = useRef(-1);
  const hoverSizeRef = useRef(EMOTION_META.map(() => 0));
  const fillsRef    = useRef(EMOTION_META.map(() => 0));
  const doneRef     = useRef(0);
  const labelRefs   = useRef([]);
  const [allDone, setAllDone] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);

  // 텍스트 번역 병합 (렌더용)
  const emotionTexts = t('hero.emotions', { returnObjects: true });
  const EMOTIONS = EMOTION_META.map((meta, i) => ({ ...meta, ...emotionTexts[i] }));

  // 애니메이션 완료(~3.2s) 후 클릭 활성화
  useEffect(() => {
    if (!allDone) { setOverlayReady(false); return; }
    const t = setTimeout(() => setOverlayReady(true), 3200);
    return () => clearTimeout(t);
  }, [allDone]);

  // 공통 초기화 (오버레이 닫기 + 상태 리셋)
  const _resetState = () => {
    setAllDone(false);
    fillsRef.current = EMOTION_META.map(() => 0);
    hoverSizeRef.current = EMOTION_META.map(() => 0);
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
          const em = EMOTION_META[idx]; // WebGL용: 텍스트 불필요
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
              if (doneRef.current === EMOTION_META.length) setAllDone(true);
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
    <>
    <SeoHead
      path="/"
      lang={i18n.language}
      description="Scentive는 매일 쓰는 일기를 AI로 분석해 세상에 하나뿐인 나만의 향 레시피를 만들어드립니다. 감정을 향으로, 하루를 향수로."
    />
    <section className={styles.hero} id="hero">

      {/* ── 텍스트 영역 — 수면 위 인트로 ── */}
      <div className={styles.textZone}>
        <span className={styles.eyebrow}>{t('hero.eyebrow')}</span>
        <h1 className={styles.headline}>
          {t('hero.headlineLine1')}<br />
          <span className={styles.highlight}>{t('hero.headlineHighlight')}</span> {t('hero.headlineLine2')}
        </h1>
        <p className={styles.sub}>{t('hero.sub')}</p>
      </div>

      {/* ── 수면 캔버스 영역 ── */}
      <div className={styles.canvasZone}>
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* SCENTIVE 텍스트 패턴 — CSS SVG 벡터 (해상도 독립) */}
        <div className={styles.scentivePattern} aria-hidden="true" />

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
              '--scent-color': em.scentColor,
              '--fill': 0,
              '--i': i,
            }}
            onMouseEnter={() => { hoverRef.current = i; }}
            onMouseLeave={() => { if (hoverRef.current === i) hoverRef.current = -1; }}
            onTouchStart={() => { hoverRef.current = i; }}
            onTouchEnd={() => { if (hoverRef.current === i) hoverRef.current = -1; }}
            onTouchCancel={() => { if (hoverRef.current === i) hoverRef.current = -1; }}
          >
            <span className={styles.emotionText}>{em.text}</span>
            <span className={styles.scentText}>{em.scent}</span>
            <span className={styles.labelInk} />
          </div>
        ))}

        {/* 잔향 — 모든 감정이 채워지면 수면 위로 떠오름 */}
        {allDone && (
          <div
            className={`${styles.janhyangOverlay} ${overlayReady ? styles.overlayReady : ''}`}
            onClick={handleReset}
          >
            <p className={styles.janhyangText}>{t('hero.overlay.title')}</p>
            <p className={styles.janhyangSub}>{t('hero.overlay.sub')}</p>
            {overlayReady && <p className={styles.overlayHint} onClick={handleGoToService}>{t('hero.overlay.hint')}</p>}
          </div>
        )}
      </div>
    </section>
    </>
  );
}
