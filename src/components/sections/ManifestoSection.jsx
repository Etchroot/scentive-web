import { useEffect, useRef, useState } from 'react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import styles from './ManifestoSection.module.css';

const LINES = [
  {
    index: '01', text: '글자는 감정을 담습니다.', keyword: '감정',
    desc: '슬플 때, 기쁠 때, 마음을 전하고 싶을 때 우리는 글을 씁니다.\n일기 한 줄에도, 메시지 하나에도 감정은 고스란히 배어 있습니다.\n글은 인간이 자신을 표현하는 가장 솔직한 기록입니다.',
  },
  {
    index: '02', text: '향은 추억을 담습니다.', keyword: '추억',
    desc: '익숙한 향 하나가 잊었던 순간을 되살립니다.\n향은 사람과 사람을 이어주고, 누군가에게는 말보다 깊이 자신을 표현하는 언어가 됩니다.',
  },
  {
    index: '03', text: '우리는 그 사이를 잇습니다.', keyword: '잇습니다',
    desc: '오래전부터 향을 감정·감각과 연결하려는 연구와 시도는 끊이지 않았습니다.\n그 축적이 향수 산업을 키웠고, 오늘날 사람들은 향에서 정체성과 서사를 발견합니다.\nScentive는 그 연결고리를 데이터로 완성합니다.',
  },
  {
    index: '04', text: '감정은 향기가 되어 데이터에 남습니다.', keyword: '데이터',
    desc: '그럼에도 향은 오랫동안 감각으로만 유추되어 왔습니다.\nScentive는 수만 건의 일기와 공개 데이터, 향 분자의 화학적 특성까지 학습 데이터로 삼아 감정과 향을 연결하는 정밀한 데이터베이스를 구축합니다.',
  },
  {
    index: '05', text: '데이터는 거대한 향의 지도가 됩니다.', keyword: '지도',
    desc: '추상적이었던 향을 정량적 데이터로 분석할 수 있다는 것, 그 자체가 혁신입니다.\nScentive의 향 지도는 개인의 일기에서 출발해 누구에게든, 어떤 상황에든 범용적으로 적용될 수 있는 인프라로 성장합니다.',
  },
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
      {item.desc && (
        <p className={styles.lineDesc}>{item.desc}</p>
      )}
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
