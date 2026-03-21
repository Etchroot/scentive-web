import { useEffect, useRef, useState } from 'react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import styles from './ManifestoSection.module.css';

const LINES = [
  { index: '01', text: '글자는 감정을 담습니다.', keyword: '감정' },
  { index: '02', text: '향은 추억을 담습니다.', keyword: '추억' },
  { index: '03', text: '우리는 그 사이를 잇습니다.', keyword: '잇습니다' },
  { index: '04', text: '감정은 향기가 되어 데이터에 남습니다.', keyword: '데이터' },
  { index: '05', text: '데이터는 거대한 향의 지도가 됩니다.', keyword: '지도' },
];

function ManifestoLine({ item, index: lineIdx }) {
  const ref = useRef(null);
  const [state, setState] = useState('hidden'); // hidden | active | revealed

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('active');
        } else if (entry.boundingClientRect.top < 0) {
          // 위로 벗어남 → revealed
          setState('revealed');
        } else {
          // 아래 → 다시 hidden
          setState('hidden');
        }
      },
      { threshold: 0.3, rootMargin: '-5% 0px -15% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderText = (text, keyword, lineState) => {
    const parts = text.split(keyword);
    if (parts.length < 2) return text;

    if (lineState === 'revealed') {
      return (
        <>
          {parts[0]}
          <span className={styles.keywordRevealed}>{keyword}</span>
          {parts[1]}
        </>
      );
    }
    if (lineState === 'active') {
      return (
        <>
          {parts[0]}
          <span className={styles.keywordActive}>{keyword}</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  return (
    <div
      ref={ref}
      className={`${styles.lineWrap} ${styles[state]}`}
      style={{ transitionDelay: `${lineIdx * 0.04}s` }}
    >
      <div className={styles.lineHeader}>
        <span className={styles.lineIndex}>{item.index}</span>
        <p className={styles.lineText}>
          {renderText(item.text, item.keyword, state)}
        </p>
      </div>
    </div>
  );
}

export default function ManifestoSection() {
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <SectionWrapper bgType="impact" id="manifesto" className={styles.section}>
      <Container>
        <div ref={sectionRef} className={styles.inner}>
          {/* 아이브로우 */}
          <p className={`${styles.eyebrow} label`}>— Our belief</p>

          {/* 선언문 블록 */}
          <div className={styles.lines}>
            {LINES.map((item, i) => (
              <ManifestoLine key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </Container>

      {/* 우측 스크롤 인디케이터 */}
      <div className={styles.scrollTrack} aria-hidden="true">
        <div
          className={styles.scrollThumb}
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>
    </SectionWrapper>
  );
}
