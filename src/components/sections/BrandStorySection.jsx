import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import AccentPanel from '../ui/AccentPanel';
import Divider from '../ui/Divider';
import styles from './BrandStorySection.module.css';

const SENSES = [
  { label: '시각', desc: '색채와 빛의 언어', highlight: false },
  { label: '청각', desc: '소리와 리듬의 언어', highlight: false },
  { label: '촉각', desc: '질감과 온도의 언어', highlight: false },
  { label: '미각', desc: '맛과 향의 언어', highlight: false },
  { label: '후각', desc: '가장 덜 탐구된 감각', highlight: true },
];

const VISIONS = [
  {
    num: '01',
    title: '초개인화 향 서비스',
    desc: '당신의 감정 데이터가 쌓일수록 더 정교해지는 향 레시피.\n세상에 단 하나뿐인 당신의 향.',
    featured: false,
  },
  {
    num: '02',
    title: '심리 치료 & 공간 설계',
    desc: '감정-향 매핑 데이터를 통해 공간과 경험을 설계하는 새로운 방법론.',
    featured: false,
  },
  {
    num: '03',
    title: '피지컬 AI의 기본 감각',
    desc: '디지털 AI가 후각을 이해할 때, 세상은 완전히 달라집니다.\nScentive가 그 언어를 만듭니다.',
    featured: true,
  },
];

export default function BrandStorySection() {
  return (
    <SectionWrapper bgType="warm" id="brand-story" className={styles.section}>
      <Container>
        {/* 파트 1 — Why we started */}
        <div className={styles.part1}>
          <div className={styles.part1Left}>
            <p className={`${styles.eyebrow} label`}>— Why we started</p>
            <h2 className={styles.heading1}>
              누구나 자신만의<br />인생의 향기가 있다
            </h2>
            <p className={styles.body1}>
              우리는 누군가의 일기에서 향기를 발견했습니다.<br />
              기억은 향으로 피어나고, 감정은 냄새로 남습니다.<br />
              그런데 왜 우리는 시각과 청각에만 집중해왔을까요.<br />
              후각은 가장 원초적이고 가장 개인적인 감각입니다.<br />
              Scentive는 그 감각에 처음으로 언어를 부여합니다.
            </p>
            <AccentPanel className={styles.accent}>
              "모든 사람은 자신만의 향을 가질 자격이 있다."
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
                    <span className={styles.senseBadge}>Most unexplored</span>
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
            <p className={`${styles.eyebrow} label`}>— Where we're going</p>
            <h2 className={styles.heading2}>
              향을 데이터로 만들면<br />세상이 달라집니다
            </h2>
          </div>

          <div className={styles.visionsGrid}>
            {VISIONS.map((v) => (
              <div
                key={v.num}
                className={styles.visionCard}
              >
                <h3 className={styles.visionTitle}>{v.title}</h3>
                <p className={styles.visionDesc} style={{ whiteSpace: 'pre-line' }}>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* 푸터 메시지 */}
          <div className={styles.footerMsg}>
            <span className={styles.dot} aria-hidden="true">●</span>
            <p>
              Scentive는 앱 서비스가 아닙니다.{' '}
              <strong>향의 언어를 만드는 첫 번째 데이터 인프라입니다.</strong>
            </p>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  );
}
