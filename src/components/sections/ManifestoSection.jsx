import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import styles from './ManifestoSection.module.css';

function FlipCard({ item, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else if (entry.boundingClientRect.top > 0) {
          setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.flipContainer} ${visible ? styles.isVisible : styles.isHidden}`}
      style={{ '--delay': `${index * 120}ms` }}
    >
      <div className={styles.flipInner}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIndex}>{item.index}</span>
            <p className={styles.cardStatement}>
              {item.text.split(item.keyword)[0]}
              <span className={styles.keywordHighlight}>{item.keyword}</span>
              {item.text.split(item.keyword)[1]}
            </p>
          </div>
          <p className={styles.cardDesc}>{item.desc}</p>
        </div>
      </div>
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
      description="글자는 감정을 담고, 향은 추억을 담습니다. NewNose가 감정과 향 사이를 데이터로 잇는 5가지 믿음."
    />
    <div ref={sectionRef}>
    <SectionWrapper bgType="impact" id="manifesto" className={styles.section}>
      {/* 배경 영상 */}
      <video
        className={styles.bgVideo}
        src="/images/petals_mobile.mp4"
        autoPlay
        muted
        playsInline
        onTimeUpdate={(e) => {
          const vid = e.target;
          const remain = vid.duration - vid.currentTime;
          // 끝 1초: 페이드아웃
          if (remain < 1) {
            vid.style.opacity = remain;
          }
          // 시작 1초: 페이드인
          else if (vid.currentTime < 1) {
            vid.style.opacity = vid.currentTime;
          }
          else {
            vid.style.opacity = 1;
          }
        }}
        onEnded={(e) => {
          const vid = e.target;
          vid.style.opacity = 0;
          vid.currentTime = 0;
          vid.play();
        }}
      />
      <div className={styles.bgOverlay} />
      <Container>
        {/* 히어로 인트로 */}
        <div className={styles.heroIntro}>
          <span className={styles.heroEyebrow}>{t('hero.eyebrow')}</span>
          <h1 className={styles.heroHeadline}>
            {t('hero.headlineLine1')}<br />
            <span className={styles.heroHighlight}>{t('hero.headlineHighlight')}</span> {t('hero.headlineLine2')}
          </h1>
        </div>

        <div className={styles.inner}>
          <p className={`${styles.eyebrow} label`}>{t('manifesto.eyebrow')}</p>

          {/* 카드 플립 그리드 */}
          <div className={styles.cardGrid}>
            {lines.map((item, i) => (
              <FlipCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </Container>

      {/* 스크롤 인디케이터 */}
      <div className={styles.scrollTrack} aria-hidden="true">
        <div
          className={styles.scrollThumb}
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>
    </SectionWrapper>
    </div>
    </>
  );
}
