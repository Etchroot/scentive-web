# NewNose 웹사이트 — 프로젝트 문서 (task.md)

> 기능 현황, 기술 스택, 파일 구조를 한눈에 파악할 수 있도록 관리됩니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 잔향 (Janhyang) — 회사: (주)뉴노즈 (NewNose) |
| 핵심 카피 | "당신의 하루를 향으로 번역합니다." |
| 플랫폼 | 웹 (반응형) + Android 앱 다운로드 유도 |
| 배포 URL | https://janhyang-web.web.app |
| Firebase 프로젝트 | `janhyang-web` |
| GitHub 레포 | `newnose-web` (main 브랜치 push → 자동 배포) |
| 앱 다운로드 URL | https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK |

---

## 기술 스택

### 프론트엔드 프레임워크
| 라이브러리 | 버전 | 용도 |
|------------|------|------|
| **React** | 18 | UI 컴포넌트 |
| **Vite** | 5 | 번들러 / 개발 서버 |
| **React Router DOM** | 6 | SPA 클라이언트 라우팅 |
| **react-i18next** | - | 다국어(i18n) 지원 |
| **i18next** | - | 번역 상태 관리 |

### 그래픽 / 시뮬레이션
| 기술 | 용도 |
|------|------|
| **WebGL 1.0** | HeroSection 유체 잉크 시뮬레이션 |
| **GLSL (Fragment Shader)** | 잉크 splat, curl-noise advection, caustic 조명 |
| **CSS SVG inline** | NewNose 워터마크 패턴 (벡터, 해상도 독립) |
| **motion/react** | 카드 스택 슬라이더, 페이지 전환 애니메이션 |
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
서비스(`/how-it-works`) → 스토리(`/brand-story`) → 브랜드 철학(`/manifesto`) → 감정-향 지도(외부) | [앱 다운로드 버튼 → `/app`] [지구본 아이콘 → 언어 드롭다운]

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
- **NEWNOSE 워터마크**: CSS `background-image: url("data:image/svg+xml,...")` 인라인 SVG로 렌더링. WebGL 텍스처 방식(Canvas2D 비트맵)에서 교체 — 해상도·종횡비 독립, fullscreen에서도 깨지지 않음

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
- **3D 팬 스타일 카드 스택 슬라이더** (motion/react 애니메이션)
- 활성 카드가 앞에, 비활성 카드는 뒤로 기울어지고 축소되는 3D perspective 효과
- 좌우 화살표 + 스와이프(드래그) + 도트 네비게이션으로 전환
- 5초 간격 자동 재생 (마우스 호버 시 일시정지) + 프로그레스 바
- 우측 텍스트 패널: AnimatePresence로 제목/설명 페이드 전환
- GlowingEffect: conic-gradient 마스크 기반 알록달록 테두리 글로우 (활성 카드만)
- 앱 스크린샷: phoneBezel 폰 목업

### BrandStorySection (`/brand-story`)
- **파트 1 — Why we started**: 좌측 텍스트 + 우측 에디토리얼 이미지 카드 3장
  - 그레이스케일 → 컬러 호버, 줌아웃 효과
  - Cormorant Garamond 세리프 이탤릭 제목
  - 중앙 radial-gradient 크로스페이드 글로우 (카드별 고유 색상)
- **파트 2 — Where we're going**: 3개 비전 카드 (이미지 + 텍스트)
  - 16:9 이미지, 그레이스케일 → 컬러 호버
  - 가장자리 inset box-shadow 크로스페이드 글로우
- desc 텍스트: 마침표 이후 줄바꿈

### ManifestoSection (`/manifesto`)
- **검은 유광 플라스틱 카드 플립 애니메이션** (스코어보드 스타일 X축 회전)
  - `linear-gradient(135deg, #0c0c0c → #1a1a1a → #0c0c0c)` 유광 표면
  - IntersectionObserver: 뷰포트 진입 시 플립인, 아래로 벗어날 때만 리셋 (위로 지나간 카드는 유지)
  - 카드 앞면: 번호 + 키워드 하이라이트(노란색) 문장 + desc 설명
- **배경 영상**: `petals_mobile.mp4` 정방향 루프 재생, 끝/시작 1초 페이드 아웃/인
- 우측 스크롤 진행 인디케이터
- 히어로 인트로 (eyebrow + headline)

#### ManifestoSection 선언문 내용 요약
| 라인 | 핵심 메시지 |
|------|------------|
| 글자는 감정을 담습니다 | 일기·메시지는 가장 솔직한 감정의 기록 |
| 향은 추억을 담습니다 | 향은 기억을 소환하고 자기표현의 언어가 됨 |
| 우리는 그 사이를 잇습니다 | 향-감정 연결 연구의 역사 → NewNose가 데이터로 완성 |
| 감정은 향기가 되어 데이터에 남습니다 | 일기·공개 데이터·**향 분자 화학 특성**까지 학습해 정밀 DB 구축 |
| 데이터는 거대한 향의 지도가 됩니다 | 정량적 향 분석 → 범용 인프라 구축 목표 |

> **과학적 근거**: NewNose 모델은 향 성분의 화학적 정보(분자 구조·어코드 DB)를 기반으로 학습. 이 내용은 4번째 선언문 desc에 반영됨.

### AppCtaSection (`/app`)
- 앱 다운로드 CTA (QR코드 + 버튼)
- Footer 포함 (개인정보처리방침, 이용약관 `/terms_of_use.html`, 문의하기)

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
├── i18n.js                          # i18next 초기화 (언어 localStorage 유지, ko fallback)
├── locales/
│   ├── ko.json                      # 한국어 — 단일 소스 (직접 편집)
│   ├── en.json                      # 영어 — scripts/translate.js 자동 생성
│   ├── ja.json                      # 일본어 — scripts/translate.js 자동 생성
│   └── zh.json                      # 중국어(간체) — scripts/translate.js 자동 생성
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
│   │   ├── AccentPanel.jsx          # border-left 강조 패널
│   │   ├── GlowingEffect.jsx        # conic-gradient 애니메이션 테두리 글로우
│   │   └── GlowingEffect.module.css
│   ├── sections/
│   │   ├── HeroSection/
│   │   │   ├── index.jsx            # 메인 컴포넌트 (RAF 루프, 마우스/터치 이벤트, 상태 관리)
│   │   │   ├── FluidInkSim.js       # WebGL 유체 시뮬레이션 클래스
│   │   │   ├── HeroScene.js         # (레거시 Three.js 씬 — 미사용)
│   │   │   ├── BubbleMesh.js        # (레거시 Three.js 버블 — 미사용)
│   │   │   └── HeroSection.module.css  # NEWNOSE SVG 워터마크 패턴 포함
│   │   ├── HowItWorksSection.jsx    # 3D 카드 스택 슬라이더 (motion/react)
│   │   ├── BrandStorySection.jsx    # 에디토리얼 이미지 카드 + 크로스페이드 글로우
│   │   ├── ManifestoSection.jsx     # 유광 카드 플립 애니메이션 + 배경 영상
│   │   └── AppCtaSection.jsx        # 앱 다운로드 CTA + Footer
│   └── common/
│       ├── Navbar.jsx               # sticky 네비게이션
│       └── ParticleCanvas.jsx       # 마우스 추적 입자 애니메이션 (전역)
└── design/
    └── color_table.txt              # 디자인 컬러 레퍼런스
```

---

## 다국어(i18n) 시스템

### 구조
- **단일 소스**: `src/locales/ko.json` — 모든 한국어 텍스트 중앙 관리
- **자동 번역**: `scripts/translate.js` 실행 시 Claude API로 en/ja/zh 자동 생성
- **fallback**: 번역 파일에 키 없으면 자동으로 한국어 표시

### 번역 재생성 방법
```bash
# .env 파일에 ANTHROPIC_API_KEY=sk-ant-xxx 설정 후:
node scripts/translate.js
```

### 언어 전환 UI
- Navbar 우측 끝 지구본 아이콘 버튼 → 클릭 시 드롭다운 (한국어/English/日本語/中文)
- 선택한 언어는 `localStorage('newnose-lang')`에 저장 → 재방문 시 유지

### 번역 대상 섹션
모든 섹션 (HeroSection 감정 라벨 포함, ManifestoSection keyword 포함)
단, WebGL 좌표·색상·이미지 경로는 번역 대상에서 제외 (컴포넌트 상수로 관리)

---

## 이미지 에셋 경로

| 파일명 | 내용 | 사용 섹션 |
|--------|------|----------|
| `public/images/screenshot-01~04.jpg` | 앱 스크린샷 (일기→분석→레시피→아카이브) | HowItWorks |
| `public/images/story-emotion.jpg` | 감정 매핑 에디토리얼 | BrandStory Part1 |
| `public/images/story-memory.jpg` | 기억 합성 에디토리얼 | BrandStory Part1 |
| `public/images/story-signature.jpg` | 개인 시그니처 에디토리얼 | BrandStory Part1 |
| `public/images/vision-personalize.jpg` | 개인화 비전 | BrandStory Part2 |
| `public/images/vision-therapy.jpg` | 테라피 비전 | BrandStory Part2 |
| `public/images/vision-ai.jpg` | AI 비전 | BrandStory Part2 |
| `public/images/petals_mobile.mp4` | 꽃잎 배경 영상 | ManifestoSection |
| `public/images/qr-code.png` | QR 코드 | AppCta 섹션 |
| `public/terms_of_use.html` | 이용약관 (독립 HTML) | Footer 링크 |

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
| 2026-03-22 | 다이아몬드 타일 → NEWNOSE 텍스트 패턴 (Canvas2D 텍스처) |
| 2026-03-22 | NEWNOSE 패턴: Canvas2D WebGL 텍스처 → CSS SVG 인라인 벡터로 교체 (해상도 독립) |
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
| 2026-03-22 | 감정 라벨 완료 시 향 이름으로 전환 + 향 고유 색상으로 배경 변경 (emotion→scent 전환 애니메이션) |
| 2026-03-22 | 다국어 시스템 구축: react-i18next 세팅, ko/en/ja/zh locale JSON, Claude API 번역 스크립트 |
| 2026-03-22 | Navbar 언어 스위처: 지구본 아이콘 클릭 → 드롭다운 언어 선택 (localStorage 유지) |
| 2026-03-25 | HowItWorksSection: 2×2 그리드 → 3D 팬 스타일 카드 스택 슬라이더 (motion/react) |
| 2026-03-25 | GlowingEffect 컴포넌트 추가 (conic-gradient 애니메이션 테두리 글로우) |
| 2026-03-25 | ParticleCanvas 추가 (마우스 추적 입자 애니메이션, 전역) |
| 2026-03-25 | BrandStorySection: 오감 테이블 → 에디토리얼 이미지 카드 + 크로스페이드 글로우 |
| 2026-03-25 | HeroSection: 감정 라벨에 Liquid Glass 효과 (SVG gooey 필터 + shimmer) |
| 2026-03-25 | ManifestoSection: 검은 유광 카드 플립 애니메이션 + 배경 영상(petals_mobile.mp4) |
| 2026-03-25 | 컨테이너 max-width 1200→1600px, Cormorant Garamond 폰트 추가 |
| 2026-03-25 | 네이밍 정리: 앱=잔향, 회사=(주)뉴노즈/NewNose, SCENTIVE 제거 |
| 2026-03-25 | 감정-향 지도 링크 → visualization-iota.vercel.app |
| 2026-03-25 | 이용약관(terms_of_use.html) 추가 및 Footer 연결 |
