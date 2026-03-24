import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import AccentPanel from '../ui/AccentPanel';
import Divider from '../ui/Divider';
import styles from './BrandStorySection.module.css';

// 에디토리얼 카드 메타 (이미지, 글로우 색상) — 번역 불필요
const CARD_META = [
  { img: '/images/story-emotion.jpg', glowColor: '210, 140, 60' },    // warm orange
  { img: '/images/story-memory.jpg', glowColor: '80, 130, 190' },     // calm blue
  { img: '/images/story-signature.jpg', glowColor: '160, 100, 180' }, // soft purple
];

// 비전 카드 메타 — 에디토리얼과 겹치지 않는 색상
const VISION_META = [
  { num: '01', img: '/images/vision-personalize.jpg', glowColor: '200, 80, 100' },  // rose
  { num: '02', img: '/images/vision-therapy.jpg', glowColor: '60, 160, 140' },      // teal
  { num: '03', img: '/images/vision-ai.jpg', glowColor: '190, 160, 60' },           // amber
];

export default function BrandStorySection() {
  const { t, i18n } = useTranslation();
  const [editorialIdx, setEditorialIdx] = useState(0);
  const [visionIdx, setVisionIdx] = useState(0);

  const cardTexts = t('brandStory.editorialCards', { returnObjects: true });
  const CARDS = CARD_META.map((meta, i) => ({ ...meta, ...cardTexts[i] }));

  const visionTexts = t('brandStory.part2.visions', { returnObjects: true });
  const VISIONS = VISION_META.map((meta, i) => ({ ...meta, ...visionTexts[i] }));

  return (
    <>
    <SeoHead
      title="브랜드 스토리"
      path="/brand-story"
      lang={i18n.language}
      description="후각은 가장 원초적이고 가장 개인적인 감각입니다. Scentive가 향의 언어를 만드는 이유와 나아갈 방향."
    />
    <SectionWrapper bgType="neutral" id="brand-story" className={styles.section}>
      {/* 파트1 배경 글로우 — 중앙형, 크로스페이드 */}
      {CARD_META.map((meta, i) => (
        <div
          key={`ed-${i}`}
          className={`${styles.bgGlow} ${i === editorialIdx ? styles.bgGlowActive : ''}`}
          style={{ '--glow-color': meta.glowColor }}
        />
      ))}

      {/* 파트2 배경 글로우 — 바깥형, 크로스페이드 */}
      {VISION_META.map((meta, i) => (
        <div
          key={`vi-${i}`}
          className={`${styles.bgGlowEdge} ${i === visionIdx ? styles.bgGlowEdgeActive : ''}`}
          style={{ '--glow-color': meta.glowColor }}
        />
      ))}

      <Container>
        {/* 파트 1 — Why we started */}
        <div className={styles.part1}>
          <div className={styles.part1Left}>
            <p className={`${styles.eyebrow} label`}>{t('brandStory.part1.eyebrow')}</p>
            <h2 className={styles.heading1} style={{ whiteSpace: 'pre-line' }}>
              {t('brandStory.part1.heading')}
            </h2>
            <p className={styles.body1} style={{ whiteSpace: 'pre-line' }}>
              {t('brandStory.part1.body')}
            </p>
            <AccentPanel className={styles.accent}>
              {t('brandStory.part1.accent')}
            </AccentPanel>
          </div>

          {/* 에디토리얼 이미지 카드 */}
          <div className={styles.editorialGrid}>
            {CARDS.map((card, i) => (
              <div
                key={i}
                className={styles.editorialCard}
                onMouseEnter={() => setEditorialIdx(i)}
              >
                <div className={styles.cardImageWrap}>
                  <img
                    src={card.img}
                    alt={card.title}
                    className={styles.cardImage}
                    loading="lazy"
                  />
                </div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Divider variant="default" className={styles.divider} />

        {/* 파트 2 — Where we're going */}
        <div className={styles.part2}>
          <div className={styles.part2Header}>
            <p className={`${styles.eyebrow} label`}>{t('brandStory.part2.eyebrow')}</p>
            <h2 className={styles.heading2} style={{ whiteSpace: 'pre-line' }}>
              {t('brandStory.part2.heading')}
            </h2>
          </div>

          <div className={styles.visionsGrid}>
            {VISIONS.map((v, i) => (
              <div
                key={v.num}
                className={styles.visionCard}
                onMouseEnter={() => setVisionIdx(i)}
              >
                <div className={styles.visionImageWrap}>
                  <img
                    src={v.img}
                    alt={v.title}
                    className={styles.visionImage}
                    loading="lazy"
                  />
                </div>
                <h3 className={styles.visionTitle}>{v.title}</h3>
                <p className={styles.visionDesc} style={{ whiteSpace: 'pre-line' }}>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* 푸터 메시지 */}
          <div className={styles.footerMsg}>
            <span className={styles.dot} aria-hidden="true">●</span>
            <p>
              {t('brandStory.part2.footerPrefix')}{' '}
              <strong>{t('brandStory.part2.footerStrong')}</strong>
            </p>
          </div>
        </div>
      </Container>
    </SectionWrapper>
    </>
  );
}
