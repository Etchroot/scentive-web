import { useEffect, useRef } from 'react';
import styles from './HeroOverlay.module.css';
import { EMOTION_BUBBLES } from './BubbleMesh';

export default function HeroOverlay({ allCompleted, scene, camera, renderer }) {
  const labelsRef = useRef([]);

  // 버블 텍스트 라벨을 Three.js 위치와 동기화
  useEffect(() => {
    if (!scene || !camera || !renderer) return;

    let raf;
    const syncLabels = () => {
      raf = requestAnimationFrame(syncLabels);
      // 씬에서 버블 메쉬 위치를 가져와 DOM 좌표로 변환
      const canvas = renderer.domElement;
      const rect = canvas.getBoundingClientRect();

      scene.children.forEach((obj) => {
        if (obj.userData.index !== undefined) {
          const idx = obj.userData.index;
          const label = labelsRef.current[idx];
          if (!label || !obj.visible) {
            if (label) label.style.opacity = '0';
            return;
          }

          const pos = obj.position.clone().project(camera);
          const x = (pos.x * 0.5 + 0.5) * rect.width + rect.left;
          const y = (-pos.y * 0.5 + 0.5) * rect.height + rect.top;

          label.style.left = `${x}px`;
          label.style.top = `${y}px`;
          label.style.opacity = obj.visible ? '1' : '0';
        }
      });
    };

    syncLabels();
    return () => cancelAnimationFrame(raf);
  }, [scene, camera, renderer]);

  return (
    <div className={styles.overlay} aria-hidden="true">
      {/* 좌상단 카피 */}
      <div className={styles.copy}>
        <span className={`${styles.eyebrow} label`}>Scent × Emotion × AI</span>
        <h1 className={styles.headline}>
          당신의 하루를<br />
          <span className={styles.highlight}>향으로</span> 번역합니다.
        </h1>
        <p className={styles.sub}>
          마우스를 움직여 하루의 감정들을 향으로 채워보세요.
        </p>
      </div>

      {/* 버블 텍스트 라벨 (Three.js 위치 동기화) */}
      <div className={styles.labels}>
        {EMOTION_BUBBLES.map((b, i) => (
          <span
            key={i}
            ref={el => labelsRef.current[i] = el}
            className={styles.bubbleLabel}
            style={{ '--bubble-color': `rgb(${Math.round(b.color[0]*255)},${Math.round(b.color[1]*255)},${Math.round(b.color[2]*255)})` }}
          >
            {b.text}
          </span>
        ))}
      </div>

      {/* 완료 후 스크롤 화살표 */}
      {allCompleted && (
        <div className={styles.scrollHint}>
          <div className={styles.scrollLabel}>Scroll</div>
          <div className={styles.scrollArrow}>
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
              <path d="M10 2v20M3 16l7 8 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
