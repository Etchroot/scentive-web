# Scentive 웹사이트 — 작업 추적 (task.md)

> 주요 작업이 완료될 때마다 업데이트됩니다.

---

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 서비스명 | Scentive |
| 기술 스택 | React (Vite), Three.js, CSS Variables, Firebase Hosting |
| Firebase 프로젝트 ID | `janhyang-1e4bc` |
| GitHub 레포 | `scentive-web` |
| 앱 다운로드 URL | https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK?usp=drive_link |
| 배포 브랜치 | `main` |

---

## 이미지 에셋 경로 안내

> 아래 경로에 이미지를 직접 복사해주세요.

| 파일명 | 내용 | 사용 섹션 |
|--------|------|----------|
| `public/images/screenshot-01.jpg` | 일기 작성 화면 | How it works Step 01 |
| `public/images/screenshot-02.jpg` | AI 분석 / 향 변환 애니메이션 | How it works Step 02 |
| `public/images/screenshot-03.jpg` | 향 레시피 결과 (달고나) | How it works Step 03 |
| `public/images/screenshot-04.jpg` | 12개월 아카이브 그리드 | How it works Step 04 |
| `public/images/qr-code.png` | QR 코드 | App CTA 섹션 |

---

## GitHub Actions 설정 안내

> 레포 생성 후 아래 시크릿을 GitHub Settings → Secrets → Actions에 추가해주세요.

| 시크릿 키 | 내용 |
|----------|------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase 서비스 계정 JSON (base64 인코딩 필요 없음, 직접 붙여넣기) |

워크플로우 파일: `.github/workflows/firebase-deploy.yml`

---

## 작업 진행 현황

### ✅ 완료
- [ ] 초기 프로젝트 구조 기획

### 🔄 진행 중
- [ ] 전체 구현

### ⏳ 대기

---

## 파일 구조

```
scentive-web/
├── public/
│   └── images/
│       ├── screenshot-01.jpg  ← 수동 추가 필요
│       ├── screenshot-02.jpg  ← 수동 추가 필요
│       ├── screenshot-03.jpg  ← 수동 추가 필요
│       ├── screenshot-04.jpg  ← 수동 추가 필요
│       └── qr-code.png        ← 수동 추가 필요
├── src/
│   ├── styles/
│   │   ├── variables.css
│   │   └── global.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SectionWrapper.jsx
│   │   │   └── Container.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Tag.jsx
│   │   │   ├── Divider.jsx
│   │   │   └── AccentPanel.jsx
│   │   ├── sections/
│   │   │   ├── HeroSection/
│   │   │   │   ├── index.jsx
│   │   │   │   ├── HeroScene.js
│   │   │   │   ├── BubbleMesh.js
│   │   │   │   ├── ParticleSystem.js
│   │   │   │   ├── LiquidBottle.js
│   │   │   │   ├── shaders/
│   │   │   │   │   ├── bubble.vert.glsl
│   │   │   │   │   ├── bubble.frag.glsl
│   │   │   │   │   ├── liquid.vert.glsl
│   │   │   │   │   └── liquid.frag.glsl
│   │   │   │   └── HeroOverlay.jsx
│   │   │   ├── ManifestoSection.jsx
│   │   │   ├── HowItWorksSection.jsx
│   │   │   ├── BrandStorySection.jsx
│   │   │   └── AppCtaSection.jsx
│   │   └── common/
│   │       ├── Navbar.jsx
│   │       └── Footer.jsx
│   ├── App.jsx
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml
├── firebase.json
├── .firebaserc
├── index.html
├── vite.config.js
└── package.json
```

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-21 | 프로젝트 초기 계획 수립, task.md 생성 |
| 2026-03-21 | 전체 구현 완료 — Vite 빌드 성공 (EXIT_CODE 0) |

---

## 빌드 결과 (최신)

```
dist/index.html                  1.43 kB
dist/assets/index-*.css         16.69 kB │ gzip: 4.01 kB
dist/assets/index-*.js          34.29 kB │ gzip: 12.81 kB
dist/assets/react-*.js         141.63 kB │ gzip: 45.44 kB
dist/assets/three-*.js         485.78 kB │ gzip: 120.76 kB
```

**청크 분리 완료**: Three.js / React / App 분리로 lazy loading 최적화