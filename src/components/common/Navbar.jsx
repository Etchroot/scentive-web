import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Button from '../ui/Button';
import styles from './Navbar.module.css';

const APP_URL = 'https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK?usp=drive_link';
const EMOTION_MAP_URL = 'https://janhyang-1e4bc.web.app';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.shadowed : ''}`}>
      <div className={styles.inner}>
        {/* 로고 */}
        <Link to="/" className={styles.logo} aria-label="Scentive 홈">
          Scentive
        </Link>

        {/* 링크 */}
        <ul className={styles.links}>
          <li>
            <NavLink
              to="/how-it-works"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              서비스
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/brand-story"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              스토리
            </NavLink>
          </li>
          <li>
            <a
              href={EMOTION_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} ${styles.external}`}
            >
              감정-향 지도
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </li>
        </ul>

        {/* CTA */}
        <Button variant="primary" href={APP_URL} target="_blank" rel="noopener noreferrer">
          앱 다운로드
        </Button>
      </div>
    </nav>
  );
}
