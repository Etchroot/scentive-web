import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://janhyang-web.web.app';
const SITE_NAME = 'NewNose';

/**
 * 페이지별 SEO 메타 태그 컴포넌트
 * @param {string} title       - 페이지 제목 (브랜드명 자동 추가)
 * @param {string} description - 페이지 설명 (160자 이내 권장)
 * @param {string} path        - 페이지 경로 (예: '/how-it-works')
 * @param {string} lang        - 현재 언어 코드 (i18n 연동)
 * @param {object} jsonLd      - 추가 JSON-LD 스키마 (선택)
 */
export default function SeoHead({ title, description, path = '/', lang = 'ko', jsonLd }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — 당신의 하루를 향으로 번역합니다`;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* 추가 JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
