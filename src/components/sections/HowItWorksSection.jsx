import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Tag from '../ui/Tag';
import GlowingEffect from '../ui/GlowingEffect';
import styles from './HowItWorksSection.module.css';

const STEP_META = [
  { num: '01', img: '/images/screenshot-01.jpg', glowColor: '221, 123, 187' },
  { num: '02', img: '/images/screenshot-02.jpg', glowColor: '215, 159, 30' },
  { num: '03', img: '/images/screenshot-03.jpg', glowColor: '90, 146, 44' },
  { num: '04', img: '/images/screenshot-04.jpg', glowColor: '76, 120, 148' },
];

const AUTO_INTERVAL = 5000;

function getCardStyle(offset, total) {
  // offset: 현재 카드와 활성 카드 사이의 거리 (0=활성, 1=바로 뒤, ...)
  if (offset === 0) {
    return {
      z: 40,
      scale: 1,
      y: 0,
      rotateX: 0,
      opacity: 1,
    };
  }

  const absOff = Math.abs(offset);
  const sign = offset > 0 ? 1 : -1;

  return {
    z: 40 - absOff * 20,
    scale: 1 - absOff * 0.06,
    y: absOff * 28 * sign,
    rotateX: absOff * -3 * sign,
    opacity: Math.max(0, 1 - absOff * 0.3),
  };
}

export default function HowItWorksSection() {
  const { t, i18n } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef(null);

  const stepTexts = t('howItWorks.steps', { returnObjects: true });
  const STEPS = STEP_META.map((meta, i) => ({ ...meta, ...stepTexts[i] }));
  const total = STEPS.length;

  const goTo = useCallback(
    (idx) => {
      setDirection(idx > activeIdx ? 1 : -1);
      setActiveIdx(idx);
    },
    [activeIdx],
  );

  const next = useCallback(() => {
    setDirection(1);
    setActiveIdx((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setActiveIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  // 자동 재생
  useEffect(() => {
    if (isHovered) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [next, isHovered]);

  // 스와이프 핸들러
  const handleDragEnd = (_e, info) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  };

  // 각 카드의 상대적 오프셋 계산
  const getOffset = (idx) => {
    let diff = idx - activeIdx;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

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
          <div className={styles.header}>
            <p className={`${styles.eyebrow} label`}>{t('howItWorks.eyebrow')}</p>
            <h2 className={styles.title}>{t('howItWorks.title')}</h2>
          </div>

          <div className={styles.sliderLayout}>
            {/* 좌측: 카드 스택 */}
            <div
              className={styles.stackArea}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className={styles.stackContainer}>
                {STEPS.map((step, i) => {
                  const offset = getOffset(i);
                  const cardStyle = getCardStyle(offset, total);
                  const isActive = i === activeIdx;

                  return (
                    <motion.div
                      key={i}
                      className={styles.stackCard}
                      animate={{
                        scale: cardStyle.scale,
                        y: cardStyle.y,
                        rotateX: cardStyle.rotateX,
                        opacity: cardStyle.opacity,
                        zIndex: total - Math.abs(offset),
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 26,
                        mass: 0.8,
                      }}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        cursor: isActive ? 'grab' : 'pointer',
                      }}
                      onClick={() => !isActive && goTo(i)}
                      {...(isActive
                        ? {
                            drag: 'x',
                            dragConstraints: { left: 0, right: 0 },
                            dragElastic: 0.15,
                            onDragEnd: handleDragEnd,
                          }
                        : {})}
                    >
                      <div className={styles.cardOuter}>
                        <GlowingEffect
                          spread={40}
                          glow
                          disabled={!isActive}
                          proximity={64}
                          inactiveZone={0.01}
                          borderWidth={3}
                        />
                        <div className={styles.cardInner}>
                          <div className={styles.cardTop}>
                            <span className={styles.cardNum}>{step.num}</span>
                            <Tag>{step.tag}</Tag>
                          </div>

                          <div className={styles.cardVisual}>
                            <div className={styles.phoneBezel}>
                              <img
                                src={step.img}
                                alt={step.imgAlt}
                                className={styles.screenshot}
                                loading="lazy"
                              />
                            </div>
                          </div>

                          <div className={styles.cardBody}>
                            <h3 className={styles.cardTitle}>{step.title}</h3>
                            <p className={styles.cardDesc} style={{ whiteSpace: 'pre-line' }}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 좌우 화살표 */}
              <button
                className={`${styles.navArrow} ${styles.navPrev}`}
                onClick={prev}
                aria-label="이전 단계"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className={`${styles.navArrow} ${styles.navNext}`}
                onClick={next}
                aria-label="다음 단계"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* 우측: 텍스트 상세 + 도트 네비 */}
            <div className={styles.infoPanel}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={styles.infoContent}
                >
                  <span className={styles.infoNum}>{STEPS[activeIdx].num}</span>
                  <h3 className={styles.infoTitle}>{STEPS[activeIdx].title}</h3>
                  <p className={styles.infoDesc} style={{ whiteSpace: 'pre-line' }}>
                    {STEPS[activeIdx].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* 도트 네비게이션 */}
              <div className={styles.dots}>
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ''}`}
                    onClick={() => goTo(i)}
                    aria-label={`${i + 1}단계로 이동`}
                  />
                ))}
              </div>

              {/* 프로그레스 바 */}
              <div className={styles.progressTrack}>
                <motion.div
                  className={styles.progressFill}
                  key={`progress-${activeIdx}-${isHovered}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isHovered ? 0 : 1 }}
                  transition={{
                    duration: isHovered ? 0 : AUTO_INTERVAL / 1000,
                    ease: 'linear',
                  }}
                />
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>
    </>
  );
}
