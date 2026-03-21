import { useEffect, useRef, useState } from 'react';
import HeroScene from './HeroScene';
import BubbleLabels from './BubbleLabels';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const canvasRef   = useRef(null);
  const sceneRef    = useRef(null);
  const [allCompleted, setAllCompleted] = useState(false);
  const [sceneObjects, setSceneObjects] = useState({ scene: null, camera: null, renderer: null });
  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    if (isMobile.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const heroScene = new HeroScene(canvas, () => setAllCompleted(true));
    sceneRef.current = heroScene;
    setSceneObjects({ scene: heroScene.scene, camera: heroScene.camera, renderer: heroScene.renderer });
    return () => heroScene.dispose();
  }, []);

  return (
    <section className={styles.hero} id="hero">

      {/* ── 텍스트 전용 영역 — 버블/캔버스와 완전히 분리 ── */}
      <div className={styles.textZone}>
        <span className={styles.eyebrow}>Scent × Emotion × AI</span>
        <h1 className={styles.headline}>
          당신의 하루를<br />
          <span className={styles.highlight}>향으로</span> 번역합니다.
        </h1>
        <p className={styles.sub}>
          마우스를 움직여 하루의 감정들을 향으로 채워보세요.
        </p>
      </div>

      {/* ── Three.js 캔버스 영역 — 나머지 공간 전부 ── */}
      <div className={styles.canvasZone}>
        {!isMobile.current ? (
          <canvas ref={canvasRef} className={styles.canvas} />
        ) : (
          <div className={styles.mobileFallback}><MobileBubbles /></div>
        )}

        {/* 버블 텍스트 라벨 (Three.js 위치 동기화) */}
        <BubbleLabels
          scene={sceneObjects.scene}
          camera={sceneObjects.camera}
          renderer={sceneObjects.renderer}
        />

        {/* 스크롤 완료 힌트 */}
        {allCompleted && <ScrollHint />}

        {/* 향수병 — 항상 하단 고정 */}
        <div className={styles.bottleWrap}>
          <BottleSvg />
        </div>
      </div>
    </section>
  );
}

/* 잔향 향수병 SVG */
function BottleSvg() {
  return (
    <svg viewBox="0 0 100 175" xmlns="http://www.w3.org/2000/svg"
      className={styles.bottleSvg} aria-label="잔향 향수병">
      <defs>
        <clipPath id="bClip3"><rect x="22" y="72" width="56" height="88" rx="5"/></clipPath>
        <linearGradient id="bG3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(230,242,252,0.75)"/>
          <stop offset="20%"  stopColor="rgba(248,253,255,0.50)"/>
          <stop offset="60%"  stopColor="rgba(235,245,255,0.30)"/>
          <stop offset="100%" stopColor="rgba(215,232,248,0.65)"/>
        </linearGradient>
        <linearGradient id="bL3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,205,90,0.55)"/>
          <stop offset="100%" stopColor="rgba(235,165,50,0.45)"/>
        </linearGradient>
      </defs>
      <path d="M38 34 L34 73 L66 73 L62 34 Z"
        fill="rgba(238,247,254,0.60)" stroke="#1F1F1F" strokeWidth="0.9" strokeLinejoin="round"/>
      <ellipse cx="50" cy="34" rx="12" ry="3.5"
        fill="rgba(235,246,254,0.90)" stroke="#1F1F1F" strokeWidth="0.9"/>
      <ellipse cx="50" cy="33" rx="8.5" ry="2.2" fill="rgba(210,232,250,0.40)"/>
      <rect x="22" y="72" width="56" height="88" rx="5"
        fill="url(#bG3)" stroke="#1F1F1F" strokeWidth="0.9"/>
      <rect x="23" y="122" width="54" height="37"
        fill="url(#bL3)" clipPath="url(#bClip3)"/>
      <path d="M23,122 C33,118 67,126 77,122"
        stroke="rgba(220,158,45,0.55)" strokeWidth="0.9" fill="none" clipPath="url(#bClip3)"/>
      <rect x="28" y="88" width="44" height="54" rx="1.5" fill="#F6EFE0"/>
      <rect x="30" y="90" width="40" height="50" rx="1"
        fill="none" stroke="#C8B090" strokeWidth="0.6"/>
      <foreignObject x="28" y="88" width="44" height="54">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:'3px' }}>
          <span style={{ fontSize:'19px', fontWeight:'600', color:'#2a2a2a', lineHeight:1,
            fontFamily:"'Noto Serif KR','Malgun Gothic',serif", letterSpacing:'0.03em' }}>잔향</span>
          <span style={{ fontSize:'4.8px', letterSpacing:'0.9px', textTransform:'uppercase',
            color:'#8a7a6a', fontFamily:'sans-serif' }}>EAU DE PARFUM</span>
          <span style={{ fontSize:'4.8px', color:'#aaa', fontFamily:'sans-serif' }}>50ml</span>
        </div>
      </foreignObject>
      <rect x="27" y="78" width="7" height="76" rx="3"
        fill="rgba(255,255,255,0.22)" clipPath="url(#bClip3)"/>
      <ellipse cx="50" cy="160" rx="28" ry="5.5"
        fill="rgba(228,240,250,0.70)" stroke="#1F1F1F" strokeWidth="0.8"/>
    </svg>
  );
}

function MobileBubbles() {
  const bubbles = [
    { text: '따뜻한 차 한 잔', color: 'rgba(255,140,51,0.3)', delay: '0s' },
    { text: '완벽한 아침',     color: 'rgba(230,242,153,0.4)', delay: '0.4s' },
    { text: '보고싶어',        color: 'rgba(255,153,191,0.35)', delay: '0.8s' },
    { text: '오늘은 칼퇴',     color: 'rgba(102,217,153,0.35)', delay: '1.2s' },
    { text: '새 옷 쇼핑',     color: 'rgba(128,230,217,0.35)', delay: '0.6s' },
    { text: '특별한 데이트',   color: 'rgba(255,128,153,0.35)', delay: '1s' },
  ];
  return (
    <>
      {bubbles.map((b, i) => (
        <div key={i} className={styles.mobileBubble}
          style={{ '--bubble-color': b.color, '--delay': b.delay,
            left: `${15+(i%3)*28}%`, top: `${20+Math.floor(i/3)*35}%` }}>
          {b.text}
        </div>
      ))}
    </>
  );
}

function ScrollHint() {
  return (
    <div style={{
      position: 'absolute', bottom: '36px', left: '50%',
      transform: 'translateX(-50%)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: '6px',
      color: 'var(--color-text-secondary)', animation: 'fadeInUp 0.8s ease forwards',
      pointerEvents: 'none',
    }}>
      <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll</span>
      <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
        <path d="M10 2v20M3 16l7 8 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
