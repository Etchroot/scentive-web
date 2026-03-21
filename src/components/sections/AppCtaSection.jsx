import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Button from '../ui/Button';
import Divider from '../ui/Divider';
import styles from './AppCtaSection.module.css';

const APP_URL = 'https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK?usp=drive_link';

export default function AppCtaSection() {
  return (
    <SectionWrapper bgType="impact" id="app-cta" className={styles.section}>
      <Container>
        <div className={styles.inner}>
          {/* 아이브로우 */}
          <p className={`${styles.eyebrow} label`}>— Start your scent journey</p>

          {/* 헤드라인 */}
          <h2 className={styles.headline}>
            오늘의 일기가{' '}
            <span className={styles.highlight}>당신의 향</span>이 됩니다.
          </h2>

          {/* 서브 */}
          <p className={styles.sub}>
            지금 시작하면 한 달 후, 처음으로 나만의 향 레시피를 받게 됩니다.
          </p>

          {/* CTA 액션 영역 */}
          <div className={styles.ctaActions}>
            {/* QR 코드 */}
            <div className={styles.qrBlock}>
              <div className={styles.qrFrame}>
                <img
                  src="/images/qr-code.png"
                  alt="앱 다운로드 QR 코드"
                  className={styles.qrImg}
                  width={72}
                  height={72}
                />
              </div>
              <p className={styles.qrLabel}>카메라로 스캔</p>
            </div>

            {/* 수직 구분선 */}
            <Divider
              variant="strong"
              direction="vertical"
              style={{ opacity: 0.2, height: 72, alignSelf: 'center' }}
            />

            {/* 버튼 블록 */}
            <div className={styles.btnBlock}>
              <Button
                variant="primary"
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 16L6 10h4V3h4v7h4l-6 6z" fill="currentColor"/>
                  <path d="M20 21H4v-2h16v2z" fill="currentColor"/>
                </svg>
                앱 다운로드
              </Button>
              <p className={styles.btnSub}>Android · 무료</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </Container>
    </SectionWrapper>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <Divider variant="default" style={{ opacity: 0.15, marginBottom: '32px' }} />

      <div className={styles.footerInner}>
        {/* 로고 */}
        <span className={styles.footerLogo}>Scentive</span>

        {/* 링크 */}
        <nav className={styles.footerLinks} aria-label="푸터 내비게이션">
          <a href="#" className={styles.footerLink}>개인정보처리방침</a>
          <a href="#" className={styles.footerLink}>이용약관</a>
          <a href="mailto:contact@scentive.io" className={styles.footerLink}>문의하기</a>
        </nav>

        {/* 카피라이트 */}
        <p className={styles.copyright}>© 2025 Scentive</p>
      </div>
    </footer>
  );
}
