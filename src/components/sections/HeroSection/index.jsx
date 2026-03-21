import { useEffect, useRef, useState } from 'react';
import HeroScene from './HeroScene';
import HeroOverlay from './HeroOverlay';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const canvasRef = useRef(null);
  const sceneRef  = useRef(null);
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
      {!isMobile.current ? (
        <canvas ref={canvasRef} className={styles.canvas} />
      ) : (
        <div className={styles.mobileFallback}><MobileBubbles /></div>
      )}

      <HeroOverlay
        allCompleted={allCompleted}
        scene={sceneObjects.scene}
        camera={sceneObjects.camera}
        renderer={sceneObjects.renderer}
      />

      {/* 향수병 — 항상 하단에 고정 */}
      <div className={styles.bottleWrap}>
        <BottleSvg />
      </div>
    </section>
  );
}

/* 잔향 향수병 SVG — 뚜껑 없음, 오픈 림 */
function BottleSvg() {
  return (
    <svg
      viewBox="0 0 100 175"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.bottleSvg}
      aria-label="잔향 향수병"
    >
      <defs>
        <clipPath id="bClip2">
          <rect x="22" y="72" width="56" height="88" rx="5" />
        </clipPath>
        <linearGradient id="bGlass2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(230,242,252,0.75)" />
          <stop offset="20%"  stopColor="rgba(248,253,255,0.50)" />
          <stop offset="60%"  stopColor="rgba(235,245,255,0.30)" />
          <stop offset="100%" stopColor="rgba(215,232,248,0.65)" />
        </linearGradient>
        <linearGradient id="bLiq2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,205,90,0.55)" />
          <stop offset="100%" stopColor="rgba(235,165,50,0.45)" />
        </linearGradient>
      </defs>

      {/* 넥 */}
      <path d="M38 34 L34 73 L66 73 L62 34 Z"
        fill="rgba(238,247,254,0.60)" stroke="#1F1F1F" strokeWidth="0.9" strokeLinejoin="round"/>

      {/* 오픈 림 (뚜껑 없음) */}
      <ellipse cx="50" cy="34" rx="12" ry="3.5"
        fill="rgba(235,246,254,0.90)" stroke="#1F1F1F" strokeWidth="0.9"/>
      <ellipse cx="50" cy="33" rx="8.5" ry="2.2"
        fill="rgba(210,232,250,0.40)"/>

      {/* 병 몸통 */}
      <rect x="22" y="72" width="56" height="88" rx="5"
        fill="url(#bGlass2)" stroke="#1F1F1F" strokeWidth="0.9"/>

      {/* 액체 */}
      <rect x="23" y="122" width="54" height="37"
        fill="url(#bLiq2)" clipPath="url(#bClip2)"/>
      <path d="M23,122 C33,118 67,126 77,122"
        stroke="rgba(220,158,45,0.55)" strokeWidth="0.9" fill="none" clipPath="url(#bClip2)"/>

      {/* 라벨 배경 */}
      <rect x="28" y="88" width="44" height="54" rx="1.5" fill="#F6EFE0"/>
      <rect x="30" y="90" width="40" height="50" rx="1"
        fill="none" stroke="#C8B090" strokeWidth="0.6"/>

      {/* 라벨 텍스트 */}
      <foreignObject x="28" y="88" width="44" height="54">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width:'100%', height:'100%',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:'3px',
          }}
        >
          <span style={{ fontSize:'19px', fontWeight:'600', color:'#2a2a2a', lineHeight:1, fontFamily:"'Noto Serif KR','Malgun Gothic',serif", letterSpacing:'0.03em' }}>잔향</span>
          <span style={{ fontSize:'4.8px', letterSpacing:'0.9px', textTransform:'uppercase', color:'#8a7a6a', fontFamily:'sans-serif' }}>EAU DE PARFUM</span>
          <span style={{ fontSize:'4.8px', color:'#aaa', fontFamily:'sans-serif' }}>50ml</span>
        </div>
      </foreignObject>

      {/* 유리 하이라이트 */}
      <rect x="27" y="78" width="7" height="76" rx="3"
        fill="rgba(255,255,255,0.22)" clipPath="url(#bClip2)"/>

      {/* 바닥 타원 */}
      <ellipse cx="50" cy="160" rx="28" ry="5.5"
        fill="rgba(228,240,250,0.70)" stroke="#1F1F1F" strokeWidth="0.8"/>
    </svg>
  );
}

function MobileBubbles() {
  const bubbles = [
    { text: '따뜻한 차 한 잔', color: 'rgba(255,140,51,0.3)', delay: '0s' },
    { text: '완벽한 아침', color: 'rgba(230,242,153,0.4)', delay: '0.4s' },
    { text: '보고싶어', color: 'rgba(255,153,191,0.35)', delay: '0.8s' },
    { text: '오늘은 칼퇴', color: 'rgba(102,217,153,0.35)', delay: '1.2s' },
    { text: '새 옷 쇼핑', color: 'rgba(128,230,217,0.35)', delay: '0.6s' },
    { text: '특별한 데이트', color: 'rgba(255,128,153,0.35)', delay: '1s' },
  ];
  return (
    <>
      {bubbles.map((b, i) => (
        <div key={i} className={styles.mobileBubble}
          style={{ '--bubble-color': b.color, '--delay': b.delay, left: `${15+(i%3)*28}%`, top: `${20+Math.floor(i/3)*35}%` }}>
          {b.text}
        </div>
      ))}
    </>
  );
}
