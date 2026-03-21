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
    if (isMobile.current) return; // 모바일은 CSS fallback

    const canvas = canvasRef.current;
    if (!canvas) return;

    const heroScene = new HeroScene(canvas, () => {
      setAllCompleted(true);
    });
    sceneRef.current = heroScene;
    setSceneObjects({
      scene: heroScene.scene,
      camera: heroScene.camera,
      renderer: heroScene.renderer,
    });

    return () => {
      heroScene.dispose();
    };
  }, []);

  return (
    <section className={styles.hero} id="hero">
      {/* Three.js 캔버스 */}
      {!isMobile.current ? (
        <canvas ref={canvasRef} className={styles.canvas} />
      ) : (
        <div className={styles.mobileFallback}>
          {/* 모바일 CSS 애니메이션 버블 */}
          <MobileBubbles />
        </div>
      )}

      {/* HTML 오버레이 카피 */}
      <HeroOverlay
        allCompleted={allCompleted}
        scene={sceneObjects.scene}
        camera={sceneObjects.camera}
        renderer={sceneObjects.renderer}
      />
    </section>
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
