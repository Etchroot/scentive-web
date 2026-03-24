import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import styles from './Navbar.module.css';

const EMOTION_MAP_URL = 'https://janhyang-1e4bc.web.app';

const LANGS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('newnose-lang', lang);
    setLangOpen(false);
  };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.shadowed : ''}`}>
      <div className={styles.inner}>
        {/* 로고 */}
        <Link to="/" className={styles.logo} aria-label="NewNose 홈">
          NewNose
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
              {t('navbar.service')}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/brand-story"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {t('navbar.story')}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/manifesto"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {t('navbar.philosophy')}
            </NavLink>
          </li>
          <li>
            <a
              href={EMOTION_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} ${styles.external}`}
            >
              {t('navbar.emotionMap')}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </li>
        </ul>

        {/* CTA */}
        <Button variant="primary" onClick={() => navigate('/app')}>
          {t('navbar.download')}
        </Button>

        {/* 언어 선택 드롭다운 */}
        <div className={styles.langWrap} ref={dropdownRef}>
          <button
            className={styles.langToggle}
            onClick={() => setLangOpen(v => !v)}
            aria-label="언어 선택"
            aria-expanded={langOpen}
          >
            {/* 지구본 아이콘 */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>

          {langOpen && (
            <ul className={styles.langDropdown}>
              {LANGS.map(({ code, label }) => (
                <li key={code}>
                  <button
                    className={`${styles.langItem} ${i18n.language === code ? styles.langItemActive : ''}`}
                    onClick={() => changeLang(code)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
