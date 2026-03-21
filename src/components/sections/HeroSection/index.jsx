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
    setSceneObjects({
      scene: heroScene.scene,
      camera: heroScene.camera,
      renderer: heroScene.renderer,
    });

    return () => heroScene.dispose();
  }, []);

  return (
    <section className={styles.hero} id="hero">
      {/* Sticky Three.js 캔버스 영역 */}
      <div className={styles.stickyZone}>
        {!isMobile.current ? (
          <canvas ref={canvasRef} className={styles.canvas} />
        ) : (
          <div className={styles.mobileFallback}>
            <MobileBubbles />
          </div>
        )}

        <HeroOverlay
          allCompleted={allCompleted}
          scene={sceneObjects.scene}
          camera={sceneObjects.camera}
          renderer={sceneObjects.renderer}
        />
      </div>

      {/* 스크롤 후 등장하는 향수병 섹션 */}
      <div className={styles.bottleSection}>
        <span className={styles.bottleTag}>Scent × Memory × 잔향</span>
        <BottleSvg />
        <p className={styles.bottleCaption}>당신의 오늘을 담은 향</p>
      </div>
    </section>
  );
}

/* SVG 향수병 일러스트 — 뚜껑 없음, 라벨에 '잔향' */
function BottleSvg() {
  return (
    <svg
      viewBox="0 0 180 320"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.bottleSvg}
      aria-label="잔향 향수병 일러스트"
    >
      <defs>
        <clipPath id="bodyClip">
          <rect x="57" y="128" width="66" height="162" rx="8" />
        </clipPath>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(235,242,250,0.7)" />
          <stop offset="40%"  stopColor="rgba(248,252,255,0.45)" />
          <stop offset="100%" stopColor="rgba(225,235,245,0.6)" />
        </linearGradient>
        <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,210,100,0.55)" />
          <stop offset="100%" stopColor="rgba(240,170,60,0.45)" />
        </linearGradient>
        <linearGradient id="neckGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(235,242,250,0.65)" />
          <stop offset="100%" stopColor="rgba(225,235,245,0.55)" />
        </linearGradient>
      </defs>

      {/* 넥 (사다리꼴) */}
      <path
        d="M72 62 L65 130 L115 130 L108 62 Z"
        fill="url(#neckGrad)"
        stroke="#1F1F1F"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* 오픈 림 (뚜껑 없음 — 타원 테두리만) */}
      <ellipse cx="90" cy="62" rx="18" ry="5.5"
        fill="rgba(240,246,252,0.9)"
        stroke="#1F1F1F" strokeWidth="1.3"
      />
      {/* 안쪽 테두리 (병 입구 깊이감) */}
      <ellipse cx="90" cy="62" rx="13" ry="3.5"
        fill="rgba(210,225,240,0.35)"
        stroke="#555" strokeWidth="0.6"
      />

      {/* 병 몸통 */}
      <rect x="57" y="128" width="66" height="162" rx="8"
        fill="url(#glassGrad)"
        stroke="#1F1F1F" strokeWidth="1.3"
      />

      {/* 액체 (클립으로 병 안에만) */}
      <rect x="58" y="218" width="64" height="71"
        fill="url(#liquidGrad)"
        clipPath="url(#bodyClip)"
      />

      {/* 액체 표면 웨이브 */}
      <path d="M58,218 C72,213 108,223 122,218"
        stroke="rgba(220,160,50,0.6)" strokeWidth="1.2"
        fill="none" clipPath="url(#bodyClip)"
      />

      {/* 라벨 배경 */}
      <rect x="64" y="168" width="52" height="78" rx="2"
        fill="#F6EFE0"
      />
      {/* 라벨 안쪽 테두리 */}
      <rect x="66.5" y="170.5" width="47" height="73" rx="1"
        fill="none" stroke="#C8B090" strokeWidth="0.7"
      />

      {/* 라벨 텍스트 (foreignObject로 한글 렌더링) */}
      <foreignObject x="64" y="168" width="52" height="78">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          <span style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#2a2a2a',
            lineHeight: 1,
            fontFamily: "'Noto Serif KR', 'Malgun Gothic', serif",
            letterSpacing: '0.04em',
          }}>
            잔향
          </span>
          <span style={{
            fontSize: '5.5px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#8a7a6a',
            fontFamily: 'sans-serif',
          }}>
            EAU DE PARFUM
          </span>
          <span style={{
            fontSize: '5.5px',
            color: '#aaa',
            fontFamily: 'sans-serif',
          }}>
            50ml
          </span>
        </div>
      </foreignObject>

      {/* 유리 하이라이트 (왼쪽 세로 반사) */}
      <rect x="63" y="135" width="8" height="110" rx="4"
        fill="rgba(255,255,255,0.22)"
        clipPath="url(#bodyClip)"
      />
      <rect x="74" y="135" width="3" height="80" rx="2"
        fill="rgba(255,255,255,0.10)"
        clipPath="url(#bodyClip)"
      />

      {/* 병 바닥 타원 */}
      <ellipse cx="90" cy="290" rx="33" ry="7"
        fill="rgba(230,238,246,0.7)"
        stroke="#1F1F1F" strokeWidth="1"
      />
    </svg>
  );
}

/* 모바일 fallback CSS 버블 */
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
        <div
          key={i}
          className={styles.mobileBubble}
          style={{
            '--bubble-color': b.color,
            '--delay': b.delay,
            left: `${15 + (i % 3) * 28}%`,
            top: `${20 + Math.floor(i / 3) * 35}%`,
          }}
        >
          {b.text}
        </div>
      ))}
    </>
  );
}
