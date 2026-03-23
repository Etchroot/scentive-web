import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import styles from './ManifestoSection.module.css';

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
      {item.desc && (
        <p className={styles.lineDesc}>{item.desc}</p>
      )}
    </div>
  );
}

export default function ManifestoSection() {
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { t, i18n } = useTranslation();

  const lines = t('manifesto.lines', { returnObjects: true }).map((line, i) => ({
    ...line,
    index: String(i + 1).padStart(2, '0'),
  }));

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
    <>
    <SeoHead
      title="브랜드 철학"
      path="/manifesto"
      lang={i18n.language}
      description="글자는 감정을 담고, 향은 추억을 담습니다. Scentive가 감정과 향 사이를 데이터로 잇는 5가지 믿음."
    />
    <SectionWrapper bgType="impact" id="manifesto" className={styles.section}>
      <Container>
        {/* ── 히어로 인트로 텍스트 (HeroSection에서 이식) ── */}
        <div className={styles.heroIntro}>
          <span className={styles.heroEyebrow}>{t('hero.eyebrow')}</span>
          <h1 className={styles.heroHeadline}>
            {t('hero.headlineLine1')}<br />
            <span className={styles.heroHighlight}>{t('hero.headlineHighlight')}</span> {t('hero.headlineLine2')}
          </h1>
        </div>

        <div ref={sectionRef} className={styles.inner}>
          {/* 아이브로우 */}
          <p className={`${styles.eyebrow} label`}>{t('manifesto.eyebrow')}</p>

          {/* 선언문 블록 */}
          <div className={styles.lines}>
            {lines.map((item, i) => (
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
    </>
  );
}
