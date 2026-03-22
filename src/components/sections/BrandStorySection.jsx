import { useTranslation } from 'react-i18next';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import AccentPanel from '../ui/AccentPanel';
import Divider from '../ui/Divider';
import styles from './BrandStorySection.module.css';

// highlight 플래그 — 번역 불필요
const SENSE_HIGHLIGHT = [false, false, false, false, true];
// 비전 번호 — 번역 불필요
const VISION_NUMS = ['01', '02', '03'];

export default function BrandStorySection() {
  const { t, i18n } = useTranslation();

  const senseTexts = t('brandStory.senses', { returnObjects: true });
  const SENSES = senseTexts.map((s, i) => ({ ...s, highlight: SENSE_HIGHLIGHT[i] }));

  const visionTexts = t('brandStory.part2.visions', { returnObjects: true });
  const VISIONS = VISION_NUMS.map((num, i) => ({ num, ...visionTexts[i] }));

  return (
    <>
    <SeoHead
      title="브랜드 스토리"
      path="/brand-story"
      lang={i18n.language}
      description="후각은 가장 원초적이고 가장 개인적인 감각입니다. Scentive가 향의 언어를 만드는 이유와 나아갈 방향."
    />
    <SectionWrapper bgType="warm" id="brand-story" className={styles.section}>
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

          <div className={styles.part1Right}>
            <div className={styles.sensesGrid}>
              {SENSES.map((s) => (
                <div
                  key={s.label}
                  className={`${styles.senseCard} ${s.highlight ? styles.senseHighlight : ''}`}
                >
                  <span className={styles.senseLabel}>{s.label}</span>
                  <span className={styles.senseDesc}>{s.desc}</span>
                  {s.highlight && (
                    <span className={styles.senseBadge}>{t('brandStory.senseBadge')}</span>
                  )}
                </div>
              ))}
            </div>
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
            {VISIONS.map((v) => (
              <div key={v.num} className={styles.visionCard}>
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
