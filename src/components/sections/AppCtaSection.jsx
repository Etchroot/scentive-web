import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SeoHead from '../common/SeoHead';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Button from '../ui/Button';
import Divider from '../ui/Divider';
import styles from './AppCtaSection.module.css';

const APP_URL = 'https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK?usp=drive_link';

export default function AppCtaSection() {
  const { t, i18n } = useTranslation();

  return (
    <>
    <SeoHead
      title="앱 다운로드"
      path="/app"
      lang={i18n.language}
      description="지금 Scentive 앱을 다운로드하고 한 달 후 세상에 하나뿐인 나만의 향 레시피를 받아보세요. Android 무료."
    />
    <SectionWrapper bgType="impact" id="app-cta" className={styles.section}>
      <Container>
        <div className={styles.inner}>
          {/* 아이브로우 */}
          <p className={`${styles.eyebrow} label`}>{t('appCta.eyebrow')}</p>

          {/* 헤드라인 */}
          <h2 className={styles.headline}>
            {t('appCta.headlinePre')}{' '}
            <span className={styles.highlight}>{t('appCta.headlineHighlight')}</span>{t('appCta.headlinePost')}
          </h2>

          {/* 서브 */}
          <p className={styles.sub}>{t('appCta.sub')}</p>

          {/* CTA 액션 영역 */}
          <div className={styles.ctaActions}>
            {/* QR 코드 */}
            <div className={styles.qrBlock}>
              <div className={styles.qrFrame}>
                <img
                  src="/images/qr-code.png"
                  alt={t('appCta.qrAlt')}
                  className={styles.qrImg}
                  width={72}
                  height={72}
                />
              </div>
              <p className={styles.qrLabel}>{t('appCta.qrLabel')}</p>
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
                {t('appCta.download')}
              </Button>
              <p className={styles.btnSub}>{t('appCta.platform')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </Container>
    </SectionWrapper>
    </>
  );
}

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <Divider variant="default" style={{ opacity: 0.15, marginBottom: '32px' }} />

      <div className={styles.footerInner}>
        {/* 로고 */}
        <span className={styles.footerLogo}>Scentive</span>

        {/* 링크 */}
        <nav className={styles.footerLinks} aria-label="footer navigation">
          <Link to="/privacy" className={styles.footerLink}>{t('footer.privacy')}</Link>
          <a href="#" className={styles.footerLink}>{t('footer.terms')}</a>
          <a href="mailto:contact@scentive.io" className={styles.footerLink}>{t('footer.contact')}</a>
        </nav>

        {/* 카피라이트 */}
        <p className={styles.copyright}>© 2026 Scentive</p>
      </div>
    </footer>
  );
}
