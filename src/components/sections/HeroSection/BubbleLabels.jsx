import { useEffect, useRef } from 'react';
import { EMOTION_BUBBLES } from './BubbleMesh';
import styles from './BubbleLabels.module.css';

export default function BubbleLabels({ scene, camera, renderer }) {
  const labelsRef = useRef([]);

  useEffect(() => {
    if (!scene || !camera || !renderer) return;

    let raf;
    const sync = () => {
      raf = requestAnimationFrame(sync);
      const canvas = renderer.domElement;
      const rect = canvas.getBoundingClientRect();

      scene.children.forEach((obj) => {
        if (obj.userData.index === undefined) return;
        const idx = obj.userData.index;
        const label = labelsRef.current[idx];
        if (!label) return;

        if (!obj.visible) { label.style.opacity = '0'; return; }

        const pos = obj.position.clone().project(camera);
        const x = (pos.x * 0.5 + 0.5) * rect.width  + rect.left;
        const y = (-pos.y * 0.5 + 0.5) * rect.height + rect.top;

        label.style.left    = `${x}px`;
        label.style.top     = `${y}px`;
        label.style.opacity = '1';
      });
    };
    sync();
    return () => cancelAnimationFrame(raf);
  }, [scene, camera, renderer]);

  return (
    <div className={styles.wrap} aria-hidden="true">
      {EMOTION_BUBBLES.map((b, i) => (
        <span
          key={i}
          ref={el => labelsRef.current[i] = el}
          className={styles.label}
          style={{ '--bc': `rgb(${Math.round(b.color[0]*255)},${Math.round(b.color[1]*255)},${Math.round(b.color[2]*255)})` }}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}
