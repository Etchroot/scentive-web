import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Tag from '../ui/Tag';
import styles from './HowItWorksSection.module.css';

// 번역 불필요 데이터 (번호, 이미지 경로)
const STEP_META = [
  { num: '01', img: '/images/screenshot-01.jpg' },
  { num: '02', img: '/images/screenshot-02.jpg' },
  { num: '03', img: '/images/screenshot-03.jpg' },
  { num: '04', img: '/images/screenshot-04.jpg' },
];

function StepItem({ step, index, activeStep }) {
  const ref = useRef(null);
  const status = index < activeStep ? 'done' : index === activeStep ? 'active' : 'upcoming';

  return (
    <div ref={ref} className={`${styles.stepItem} ${styles[`status_${status}`]}`}>
      {/* 스텝 번호 원 */}
      <div className={styles.stepNum} aria-label={`Step ${step.num}`}>
        <span>{step.num}</span>
      </div>

      {/* 본문 */}
      <div className={styles.stepBody}>
        <Tag>{step.tag}</Tag>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p className={styles.stepDesc} style={{ whiteSpace: 'pre-line' }}>{step.desc}</p>
      </div>

      {/* 앱 스크린샷 */}
      <div className={styles.stepVisual}>
        <div className={styles.phoneBezel}>
          <img
            src={step.img}
            alt={step.imgAlt}
            className={styles.screenshot}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const itemRefs = useRef([]);
  const connectorFillRef = useRef(null);
  const { t, i18n } = useTranslation();

  const stepTexts = t('howItWorks.steps', { returnObjects: true });
  const STEPS = STEP_META.map((meta, i) => ({ ...meta, ...stepTexts[i] }));

  useEffect(() => {
    const observers = itemRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(i);
          }
        },
        { threshold: 0.45 }
      );
      obs.observe(el);
      return obs;
    });

    return () => observers.forEach(obs => obs && obs.disconnect());
  }, []);

  // 커넥터 라인 높이 업데이트
  useEffect(() => {
    if (connectorFillRef.current) {
      const pct = (activeStep / (STEPS.length - 1)) * 100;
      connectorFillRef.current.style.height = `${pct}%`;
    }
  }, [activeStep]);

  return (
    <>
    <SeoHead
      title="서비스 소개"
      path="/how-it-works"
      lang={i18n.language}
      description="일기 → AI 감정 분석 → 향 레시피 → 아카이브. Scentive가 하루의 감정을 향으로 만드는 4단계 과정을 소개합니다."
    />
    <SectionWrapper bgType="neutral" id="how-it-works" className={styles.section}>
      <Container>
        {/* 섹션 헤더 */}
        <div className={styles.header}>
          <p className={`${styles.eyebrow} label`}>{t('howItWorks.eyebrow')}</p>
          <h2 className={styles.title}>{t('howItWorks.title')}</h2>
        </div>

        {/* 스텝 리스트 */}
        <div className={styles.stepList}>
          {/* 수직 커넥터 라인 */}
          <div className={styles.connector} aria-hidden="true">
            <div ref={connectorFillRef} className={styles.connectorFill} />
          </div>

          {STEPS.map((step, i) => (
            <div
              key={i}
              ref={el => itemRefs.current[i] = el}
            >
              <StepItem step={step} index={i} activeStep={activeStep} />
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
    </>
  );
}
