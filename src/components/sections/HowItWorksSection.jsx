import { useEffect, useRef, useState } from 'react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Tag from '../ui/Tag';
import styles from './HowItWorksSection.module.css';

const STEPS = [
  {
    num: '01',
    tag: '매일',
    title: '일기를 씁니다',
    desc: '오늘 하루 있었던 일, 느꼈던 감정을 자유롭게 기록해요.\n감정 태그로 그날의 기분을 더할 수 있어요.',
    img: '/images/screenshot-01.jpg',
    imgAlt: '일기 작성 앱 화면',
  },
  {
    num: '02',
    tag: '월말 자동',
    title: 'AI가 감정을 분석합니다',
    desc: '한 달간 쌓인 일기에서 감정·감각·형용사 키워드를 추출하고 패턴을 찾아냅니다.',
    img: '/images/screenshot-02.jpg',
    imgAlt: 'AI 분석 앱 화면',
  },
  {
    num: '03',
    tag: '50가지 어코드',
    title: '향 레시피가 완성됩니다',
    desc: '추출된 키워드를 50개 향 어코드 DB와 매칭해 탑·미들·베이스 노트로 구성된 나만의 레시피를 만들어요.',
    img: '/images/screenshot-03.jpg',
    imgAlt: '향 레시피 앱 화면',
  },
  {
    num: '04',
    tag: '12개월 기록',
    title: '향 리포트로 아카이빙됩니다',
    desc: '그 달의 향수가 완성되어 아카이브에 저장됩니다.\n12개의 향수병이 하나씩 채워져 가요.',
    img: '/images/screenshot-04.jpg',
    imgAlt: '아카이브 앱 화면',
  },
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
    <SectionWrapper bgType="neutral" id="how-it-works" className={styles.section}>
      <Container>
        {/* 섹션 헤더 */}
        <div className={styles.header}>
          <p className={`${styles.eyebrow} label`}>— How it works</p>
          <h2 className={styles.title}>하루의 감정이 향이 되기까지</h2>
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
  );
}
