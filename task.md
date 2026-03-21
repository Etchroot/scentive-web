# Scentive 웹사이트 — 프로젝트 문서 (task.md)

> 기능 현황, 기술 스택, 파일 구조를 한눈에 파악할 수 있도록 관리됩니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Scentive (센티브) |
| 핵심 카피 | "당신의 하루를 향으로 번역합니다." |
| 플랫폼 | 웹 (반응형) + Android 앱 다운로드 유도 |
| 배포 URL | https://janhyang-web.web.app |
| Firebase 프로젝트 | `janhyang-web` |
| GitHub 레포 | `scentive-web` (main 브랜치 push → 자동 배포) |
| 앱 다운로드 URL | https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK |

---

## 기술 스택

### 프론트엔드 프레임워크
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| **React** | 18 | UI 컴포넌트 |
| **Vite** | 5 | 번들러 / 개발 서버 |
| **React Router DOM** | 6 | SPA 클라이언트 라우팅 |

### 그래픽 / 시뮬레이션
| 기술 | 용도 |
|------|------|
| **WebGL 1.0** | HeroSection 유체 잉크 시뮬레이션 |
| **GLSL (Fragment Shader)** | 잉크 splat, curl-noise advection, caustic 조명 |
| **CSS SVG inline** | SCENTIVE 워터마크 패턴 (벡터, 해상도 독립) |
| **Three.js** | (레거시 — 초기 버블 씬 구현 시 사용, 현재 미사용) |

### 인프라 / 배포
| 도구 | 용도 |
|------|------|
| **Firebase Hosting** | 정적 웹 호스팅, SPA rewrites |
| **GitHub Actions** | main push 시 자동 빌드 + Firebase 배포 |

---

## 페이지 라우트 구조

```
/                  → HeroSection       (인터랙티브 잉크-수면 메인 화면)
/how-it-works      → HowItWorksSection (서비스 소개 4단계)
/brand-story       → BrandStorySection (브랜드 스토리)
/manifesto         → ManifestoSection  (브랜드 철학 선언)
/app               → AppCtaSection     (앱 다운로드 CTA + Footer)
```

- 라우트 전환 시 `ScrollToTop` 컴포넌트가 `window.scrollTo(0, 0)` 실행 → 항상 최상단부터 표시

### 네비게이션 바 링크 순서
서비스(`/how-it-works`) → 스토리(`/brand-story`) → 브랜드 철학(`/manifesto`) → 감정-향 지도(외부) | [앱 다운로드 버튼 → `/app`]

---

## HeroSection — WebGL 유체 잉크 시뮬레이션

가장 핵심적인 기능. 순수 WebGL로 구현된 인터랙티브 잉크-수면 시뮬레이션.

### 셰이더 프로그램 (3개)

| 프로그램 | 역할 |
|----------|------|
| **SPLAT** | 호버/터치 시 감정 위치에 가우시안 잉크 점 주입. alpha 최대 0.80으로 제한하여 항상 반투명 유지 |
| **ADVECT** | curl-noise 기반 advection + 5-tap box diffusion. 잉크가 물결을 따라 자연스럽게 퍼짐 |
| **DISPLAY** | 최종 합성 — 수면 caustic 조명 + 잉크 반투명 블렌딩 |

### 주요 알고리즘

- **Curl-noise advection**: gradient noise의 컬(curl)을 이용한 발산 없는(divergence-free) 속도장 생성 → 잉크가 자연스러운 소용돌이 형태로 퍼짐
- **Ping-pong FBO**: 512×512 더블 프레임버퍼로 잉크 상태를 매 프레임 교체하며 업데이트
- **Caustic 조명**: 4항 sin/cos 간섭 패턴 (`pow(..., 4.0)`)으로 수면 광굴절 표현
- **SCENTIVE 워터마크**: CSS `background-image: url("data:image/svg+xml,...")` 인라인 SVG로 렌더링. WebGL 텍스처 방식(Canvas2D 비트맵)에서 교체 — 해상도·종횡비 독립, fullscreen에서도 깨지지 않음

### 인터랙션 흐름

1. 감정 라벨에 **마우스 호버 또는 터치 홀드** → 매 프레임 5회 splat 주입, fill 게이지(0→1) 누적
2. fill=1 도달 → 라벨 `labelDone` 스타일 적용 (흐려지고 작아짐)
3. **전체 감정 완료** → `잔향` 오버레이 등장 (1.4s fade-in 애니메이션)
4. 오버레이 **배경 클릭** → 초기화 + 상단 복귀
5. **"서비스 둘러보기" 클릭** → 초기화 + `/how-it-works` 라우트 이동

### 디바이스 지원
- 데스크탑: 마우스 호버로 감정 라벨 인터랙션
- 모바일: 터치 홀드(`onTouchStart` / `onTouchEnd` / `onTouchCancel`)로 동일 인터랙션 지원
- WebGL 미지원 기기: try/catch로 조용히 폴백

### 성능 최적화
- React re-render 없이 RAF 루프 내 **직접 DOM 조작** (`el.style.setProperty('--fill', ...)`)

---

## 섹션별 주요 사항

### HowItWorksSection (`/how-it-works`)
- 4단계 스크롤 스텝 리스트 (IntersectionObserver로 활성 스텝 감지)
- 앱 스크린샷: `phoneBezel` 180px (모바일 135px) — 9:19 비율 폰 목업
- 수직 커넥터 라인: 스크롤에 따라 노란색으로 채워짐
- desc 텍스트: 마침표 이후 줄바꿈 (`white-space: pre-line`)

### BrandStorySection (`/brand-story`)
- **파트 1 — Why we started**: 좌측 텍스트 + 우측 5감 카드 그리드 (`align-items: center`로 세로 중앙 정렬)
- **파트 2 — Where we're going**: 3개 비전 카드 (번호 없음, 동일 스타일)
- 모든 컴포넌트 `border-radius: 0` (직각 모서리)
- desc 텍스트: 마침표 이후 줄바꿈

### ManifestoSection (`/manifesto`)
- 5개 선언문 라인, 스크롤 IntersectionObserver로 hidden→active→revealed 상태 전환
- 각 라인에 `keyword` 하이라이트 (active: 노란 배경, revealed: 노란 밑줄)
- 각 라인 아래 **desc 본문** 추가 (마침표 후 줄바꿈, `padding-left: 38px`으로 번호와 정렬)
- 우측 스크롤 진행 인디케이터

#### ManifestoSection 선언문 내용 요약
| 라인 | 핵심 메시지 |
|------|------------|
| 글자는 감정을 담습니다 | 일기·메시지는 가장 솔직한 감정의 기록 |
| 향은 추억을 담습니다 | 향은 기억을 소환하고 자기표현의 언어가 됨 |
| 우리는 그 사이를 잇습니다 | 향-감정 연결 연구의 역사 → Scentive가 데이터로 완성 |
| 감정은 향기가 되어 데이터에 남습니다 | 일기·공개 데이터·**향 분자 화학 특성**까지 학습해 정밀 DB 구축 |
| 데이터는 거대한 향의 지도가 됩니다 | 정량적 향 분석 → 범용 인프라 구축 목표 |

> **과학적 근거**: Scentive 모델은 향 성분의 화학적 정보(분자 구조·어코드 DB)를 기반으로 학습. 이 내용은 4번째 선언문 desc에 반영됨.

### AppCtaSection (`/app`)
- 앱 다운로드 CTA (QR코드 + 버튼)
- Footer 포함 (개인정보처리방침, 이용약관, 문의하기)

---

## 디자인 시스템

### 컬러
> CSS 변수 기반. `design/color_table.txt` 참조.

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-point` | Warning 400 `#FFDD82` | 버튼·태그 소면적 강조 |
| `--color-accent` | Warning 500 `#FFC62B` | 호버 강조 |
| `--color-text-primary` | N700 `#1F1F1F` | 본문 텍스트 |
| `--color-text-secondary` | N600 `#4B4B4B` | 보조 텍스트 |
| `--color-text-muted` | N500 `#8E8E8E` | 힌트 텍스트 |
| `--color-bg-warm` | Warning 200 `#FFF7E1` | 따뜻한 배경 |
| `--color-bg-neutral` | N50 `#FAFAFA` | 중립 배경 |
| `--color-bg-impact` | N400 `#CACACA` | 임팩트 배경 |

### 공통 UI 규칙
- **Button**: `border-radius: 0` (직각), variant: primary/outline/ghost
- **모든 카드/패널**: `border-radius: 0` (직각 모서리 통일)
- **텍스트 줄바꿈**: 마침표(.) 이후 `\n` + `white-space: pre-line` 적용 (모든 섹션 desc)

---

## 컴포넌트 아키텍처

```
src/
├── App.jsx                          # BrowserRouter + Routes + ScrollToTop
├── main.jsx                         # React 진입점
├── styles/
│   ├── variables.css                # CSS 변수 (컬러 시스템)
│   └── global.css                   # 전역 스타일
├── components/
│   ├── layout/
│   │   ├── SectionWrapper.jsx       # bgType: 'warm'|'neutral'|'impact'
│   │   └── Container.jsx            # 최대 너비 + 패딩
│   ├── ui/
│   │   ├── Button.jsx               # variant: 'primary'|'outline'|'ghost', border-radius: 0
│   │   ├── Tag.jsx                  # 소형 레이블
│   │   ├── Divider.jsx              # 구분선
│   │   └── AccentPanel.jsx          # border-left 강조 패널
│   ├── sections/
│   │   ├── HeroSection/
│   │   │   ├── index.jsx            # 메인 컴포넌트 (RAF 루프, 마우스/터치 이벤트, 상태 관리)
│   │   │   ├── FluidInkSim.js       # WebGL 유체 시뮬레이션 클래스
│   │   │   ├── HeroScene.js         # (레거시 Three.js 씬 — 미사용)
│   │   │   ├── BubbleMesh.js        # (레거시 Three.js 버블 — 미사용)
│   │   │   └── HeroSection.module.css  # SCENTIVE SVG 워터마크 패턴 포함
│   │   ├── HowItWorksSection.jsx    # 서비스 소개 4단계
│   │   ├── BrandStorySection.jsx    # 브랜드 스토리 (Why / Where)
│   │   ├── ManifestoSection.jsx     # 브랜드 철학 선언 (5개 라인 + desc)
│   │   └── AppCtaSection.jsx        # 앱 다운로드 CTA + Footer
│   └── common/
│       └── Navbar.jsx               # sticky 네비게이션
└── design/
    └── color_table.txt              # 디자인 컬러 레퍼런스
```

---

## 이미지 에셋 경로

| 파일명 | 내용 | 사용 섹션 |
|--------|------|----------|
| `public/images/screenshot-01.jpg` | 일기 작성 화면 | HowItWorks Step 1 |
| `public/images/screenshot-02.jpg` | AI 분석 화면 | HowItWorks Step 2 |
| `public/images/screenshot-03.jpg` | 향 레시피 결과 | HowItWorks Step 3 |
| `public/images/screenshot-04.jpg` | 아카이브 그리드 | HowItWorks Step 4 |
| `public/images/qr-code.png` | QR 코드 | AppCta 섹션 |

---

## 배포 설정

| 파일 | 내용 |
|------|------|
| `firebase.json` | public: `dist`, SPA rewrites → `/index.html` |
| `.firebaserc` | project: `janhyang-web` |
| `.github/workflows/firebase-deploy.yml` | main push → 자동 빌드 + 배포 |

**GitHub Secret 필요**: `FIREBASE_SERVICE_ACCOUNT` (Firebase 서비스 계정 JSON)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-21 | 프로젝트 초기 계획 및 전체 구현 |
| 2026-03-22 | Three.js → 순수 WebGL로 HeroSection 전면 교체 |
| 2026-03-22 | WebGL 유체 시뮬레이션 점진적 개선 (curl-noise, caustic, splat 튜닝) |
| 2026-03-22 | 다이아몬드 타일 → SCENTIVE 텍스트 패턴 (Canvas2D 텍스처) |
| 2026-03-22 | SCENTIVE 패턴: Canvas2D WebGL 텍스처 → CSS SVG 인라인 벡터로 교체 (해상도 독립) |
| 2026-03-22 | SPA React Router 라우팅 구조 확립 (5개 라우트) |
| 2026-03-22 | 오버레이 CTA "서비스 둘러보기" 버그 수정 (useNavigate) |
| 2026-03-22 | Navbar 링크 순서 조정, 앱 다운로드 버튼 내부 라우트 연결 |
| 2026-03-22 | design/color_table.txt 추가 (N700=#1F1F1F 등 디자인 레퍼런스) |
| 2026-03-22 | 모바일 WebGL 활성화 + 터치 이벤트 지원 (onTouchStart/End/Cancel) |
| 2026-03-22 | ScrollToTop 컴포넌트 추가 — 라우트 전환 시 항상 최상단 표시 |
| 2026-03-22 | 전체 섹션 마침표 이후 줄바꿈 적용 (white-space: pre-line) |
| 2026-03-22 | HowItWorks 폰 목업 1.5배 확대 (120→180px) |
| 2026-03-22 | 전체 UI 직각 모서리 통일 (Button, 카드, 그리드 border-radius: 0) |
| 2026-03-22 | BrandStory: 감각 그리드 세로 중앙 정렬, 비전 카드 번호 제거, 강조 카드 제거 |
| 2026-03-22 | Navbar '선언' → '브랜드 철학' |
| 2026-03-22 | ManifestoSection 각 선언문에 desc 본문 추가 (화학 분자 데이터 기반 과학적 내용 포함) |
