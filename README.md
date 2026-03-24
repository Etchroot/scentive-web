# NewNose 웹사이트

**"당신의 하루를 향으로 번역해드립니다."**

NewNose 앱 서비스를 소개하는 기업/팀 소개 웹사이트입니다.

🌐 **라이브 URL**: https://janhyang-web.web.app

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 라우팅 | React Router v7 |
| 다국어 | react-i18next (ko / en / ja / zh) |
| SEO | react-helmet-async |
| 렌더링 | WebGL (FluidInkSim — 잉크 번짐 시뮬레이션) |
| 호스팅 | Firebase Hosting |
| 자동 배포 | GitHub Actions → main 브랜치 push 시 자동 배포 |

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

> 로컬 개발 환경에서는 언어가 항상 **한국어**로 고정됩니다.

---

## 페이지 구조

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | HeroSection | 메인 — WebGL 잉크 번짐 인터랙션 |
| `/how-it-works` | HowItWorksSection | 서비스 작동 방식 3단계 |
| `/brand-story` | BrandStorySection | 브랜드 스토리 |
| `/manifesto` | ManifestoSection | 브랜드 선언문 |
| `/app` | AppCtaSection | 앱 다운로드 CTA + 푸터 |
| `/privacy` | PrivacyPage | 개인정보처리방침 + AI 윤리 |

---

## 프로젝트 구조

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx          # 스티키 네비게이션 + 언어 전환 드롭다운
│   │   └── SeoHead.jsx         # 페이지별 메타태그 (Helmet 래퍼)
│   ├── layout/
│   │   ├── SectionWrapper.jsx  # bgType: warm | neutral | impact
│   │   └── Container.jsx       # 최대 너비 + 좌우 패딩
│   ├── ui/
│   │   ├── Button.jsx          # variant: primary | outline | ghost
│   │   ├── Tag.jsx
│   │   ├── Divider.jsx
│   │   └── AccentPanel.jsx
│   └── sections/
│       ├── HeroSection/
│       │   ├── index.jsx       # WebGL 인터랙션 + 감정 라벨
│       │   └── FluidInkSim.js  # WebGL 잉크 시뮬레이션 코어
│       ├── ManifestoSection.jsx
│       ├── HowItWorksSection.jsx
│       ├── BrandStorySection.jsx
│       └── AppCtaSection.jsx   # 앱 다운로드 + 인라인 푸터
├── pages/
│   └── PrivacyPage.jsx         # 개인정보처리방침 (법적 문서 — 한국어 고정)
├── locales/
│   ├── ko.json                 # 번역 원본 (단일 소스 of truth)
│   ├── en.json                 # 자동 생성 (scripts/translate.js)
│   ├── ja.json                 # 자동 생성
│   └── zh.json                 # 자동 생성
├── i18n.js                     # i18next 초기화
├── App.jsx                     # 라우터 설정
└── main.jsx                    # 앱 진입점 (HelmetProvider 포함)
scripts/
└── translate.js                # ko.json → en/ja/zh 자동 번역 스크립트
public/
├── robots.txt
└── sitemap.xml
```

---

## 다국어 (i18n)

### 번역 텍스트 수정
`src/locales/ko.json`만 수정하면 됩니다. 이 파일이 **단일 소스**입니다.

### 번역 자동 생성

1. 프로젝트 루트에 `.env` 파일 생성:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxx
   ```
2. 스크립트 실행:
   ```bash
   node scripts/translate.js
   ```
   → `en.json`, `ja.json`, `zh.json`이 자동으로 업데이트됩니다.

### 언어 전환
- 사용자: Navbar 지구본 아이콘 → 드롭다운에서 선택
- 선택 언어는 `localStorage`에 저장되어 재방문 시 유지됨
- 로컬 개발 시 항상 한국어 고정 (`i18n.js`)

---

## 배포

### 자동 배포
`main` 브랜치에 push하면 GitHub Actions가 자동으로 Firebase에 배포합니다.

```bash
git push origin main
# → GitHub Actions 실행 → Firebase Hosting 자동 배포
```

### 수동 배포
```bash
npm run build
firebase deploy --only hosting
```

### 관련 설정 파일
- `firebase.json` — Firebase Hosting 설정 (SPA rewrites 포함)
- `.firebaserc` — Firebase 프로젝트 `Janhyang` 연결
- `.github/workflows/firebase-deploy.yml` — GitHub Actions 워크플로우

---

## 디자인 시스템

CSS 변수로 색상을 관리합니다. HEX 하드코딩 금지.

```css
--color-bg-warm:          #FFF7E1
--color-bg-neutral:       #FAFAFA
--color-bg-impact:        #CACACA
--color-point:            #FFDD82   /* 소면적 강조 전용 (배경 사용 금지) */
--color-accent:           #FFC62B
--color-text-primary:     #1F1F1F
--color-text-secondary:   #4B4B4B
--color-text-muted:       #8E8E8E
```

자세한 규칙은 `CLAUDE.md` 및 `planning.md` 참조.
