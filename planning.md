# planning.md — NewNose 웹사이트 기획 문서

> 섹션별 레이아웃·인터랙션·기술 스펙을 기록합니다.
> 공통 룰(컬러, 컴포넌트 등)은 `CLAUDE.md`를 참조하세요.

---

## 프로젝트 컨텍스트

| 항목 | 내용 |
|------|------|
| 포지셔닝 | 장르 자체를 새로 만드는 크리에이티브 컬렉티브 |
| 디자인 무드 | 실험적·아방가르드. 예측 가능한 향수 브랜드 미학을 의도적으로 배반 |
| 주요 목적 | 브랜드/팀 소개, 브랜드 스토리·철학, 서비스/앱 기능 소개, 앱 다운로드 CTA |

---

## 섹션 구성 & 배경

| # | 섹션명 | 배경 | 역할 |
|---|--------|------|------|
| 1 | Hero | `#FFFFFF` (Three.js canvas) | 인터랙티브 감정 버블 체험 |
| 2 | Manifesto | `--color-bg-impact` | 브랜드 선언문, 스크롤 인터랙션 |
| 3 | How it works | `--color-bg-neutral` | 서비스 파이프라인 시각화 |
| 4 | Brand Story | `--color-bg-warm` | 철학·창업 스토리 |
| 5 | App CTA | `--color-bg-impact` | 앱 다운로드 최종 유도 |

---

## 섹션 1 — Hero

### 개요
Three.js 풀스크린 캔버스로 구현. 서비스 핵심 파이프라인(감정 → 향)을 인터랙티브하게 체험.
Hero 섹션 내에 앱 다운로드 CTA 없음 — Navbar 전용.

### 화면 구조 (2단계)

```
[1단계 — 초기 / 버블 부유 중]
  흰 배경 + 감정 버블들이 둥둥 떠다님
  좌상단 고정: 헤드라인 카피
  마우스를 따라다니는 옅한 안개 fog 효과

[2단계 — 버블 인터랙션 완료 후]
  깔대기 라인 등장
  채워진 물방울들이 깔대기로 낙하
  향수병 fill-up → 브랜드 네임 라벨 reveal
  스크롤 유도 화살표 fade-in
```

### HeroOverlay 카피 (HTML — position: absolute, pointer-events: none, z-index: 10)

```
좌상단 고정 (top: 80px, left: 64px)
├── eyebrow: "Scent × Emotion × AI"
│   → N500, 11px, letter-spacing 0.14em, uppercase
├── headline: "당신의 하루를\n향으로 번역합니다."
│   → N700, 52px, font-weight 500, line-height 1.15
│   → "향으로" : border-bottom 3px solid --color-point
└── sub: "마우스를 움직여 하루의 감정들을 향으로 채워보세요."
    → N600, 15px, line-height 1.7

[버블 완료 후에만]
└── 스크롤 유도 화살표 (↓) — 중앙 하단, fade-in
```

### 감정 버블 데이터

```js
const EMOTION_BUBBLES = [
  { text: "따뜻한 차 한 잔",       color: [1.0, 0.55, 0.2],  radius: 52 },
  { text: "취준 성공",             color: [1.0, 0.87, 0.2],  radius: 44 },
  { text: "완벽한 아침",           color: [0.9, 0.95, 0.6],  radius: 48 },
  { text: "이불 밖은 위험해",      color: [0.6, 0.75, 1.0],  radius: 56 },
  { text: "보고싶어",              color: [1.0, 0.6,  0.75], radius: 46 },
  { text: "새 옷 쇼핑",            color: [0.5, 0.9,  0.85], radius: 42 },
  { text: "아무것도 하기 싫은 날", color: [0.7, 0.65, 0.9],  radius: 50 },
  { text: "오늘은 칼퇴",           color: [0.4, 0.85, 0.6],  radius: 40 },
  { text: "치킨 맛있다",           color: [1.0, 0.7,  0.3],  radius: 44 },
  { text: "특별한 데이트",         color: [1.0, 0.5,  0.6],  radius: 48 },
];
```

### Three.js Scene 구조

```
Scene
├── AmbientLight + DirectionalLight
├── BubbleGroup (InstancedMesh — SphereGeometry + ShaderMaterial)
├── FogSprite (커서 trailing — PlaneGeometry + SpriteMaterial)
├── FunnelLines (깔대기 — LineSegments, N700)
├── ParticleSystem (응축 물방울 → 중력 낙하)
└── BottleGroup
    ├── BottleGeometry (CylinderGeometry 조합)
    └── LiquidPlane (ShaderMaterial — 수위 상승)
```

### BubbleMesh ShaderMaterial 핵심 uniform

```glsl
uniform float uFill;       // 0.0 ~ 1.0 채우기 진행도
uniform vec3  uFluidColor; // 감정 색상
uniform float uTime;       // 애니메이션 시간
uniform float uHover;      // 0.0 | 1.0

// uFill 0 → iridescent 투명
// uFill 1 → 유체 색 swirl로 가득 찬 상태
// 중간 → mix(iridescent, fluidColor, uFill) + noise 경계
```

### 인터랙션 흐름

```
1. 버블 부유 (idle)
   sin/cos 기반 느린 random float, uFill = 0.0

2. 마우스 안개
   mousemove → FogSprite position 업데이트
   opacity 0.06~0.12, size 120px, trailing fade

3. 버블 hover → 채우기
   Raycaster hit 유지 시간 비례로 uFill += delta * fillSpeed
   uFill >= 1.0 → 응축 트리거

4. 응축 & 낙하
   버블 scale 1.0 → 0.3 수축
   파티클 20~40개 spawn → y -= gravity * dt
   깔대기 선 충돌 시 방향 굴절

5. 향수병 채우기
   파티클이 병 입구 도달 → liquidLevel 증가
   LiquidPlane uLevel uniform → 수위 상승

6. 라벨 reveal
   모든 버블 완료 후 CSS overlay fade-in
   "NewNose" 텍스트 + 스크롤 화살표
```

### 성능 가이드라인

- 버블: `InstancedMesh` 사용 (drawcall 최소화)
- 파티클: `Points` geometry (단일 drawcall)
- 버블 텍스트 라벨: HTML overlay, Three.js로 위치만 동기화
- 목표 FPS: 60fps (mid-range laptop)
- 모바일: Three.js 대신 CSS animation fallback

### 파일 구조

```
src/components/sections/HeroSection/
├── index.jsx
├── HeroScene.js
├── BubbleMesh.js
├── ParticleSystem.js
├── LiquidBottle.js
├── shaders/
│   ├── bubble.vert.glsl
│   ├── bubble.frag.glsl
│   ├── liquid.vert.glsl
│   └── liquid.frag.glsl
└── HeroOverlay.jsx
```

---

## 섹션 2 — Manifesto

### 개요
N400 배경. 짧고 강한 선언문이 스크롤 진행도에 따라 순차 reveal.
선언문 블록 사이에 사진·장문 텍스트 슬롯 예약 — 콘텐츠 없으면 패딩만, 있으면 자동 확장.

### 선언문 카피 (확정)

```
01. 글자는 감정을 담습니다.
02. 향은 추억을 담습니다.
03. 우리는 그 사이를 잇습니다.
04. 감정은 향기가 되어 데이터에 남습니다.
05. 데이터는 거대한 향의 지도가 됩니다.
```

### 텍스트 상태 (스크롤 진행도별)

| 상태 | opacity | 키워드 처리 |
|------|---------|------------|
| hidden (아직) | 0.15 | — |
| active (현재 viewport) | 1.0 | W400 color |
| revealed (지나간 줄) | 1.0 | W400 border-bottom 2.5px |

### 레이아웃 구조

```
Navbar (페이지 레벨 sticky — 섹션 컴포넌트 밖)
ManifestoSection (N400 배경)
├── eyebrow: "— Our belief"  (N700 opacity 0.4, 11px uppercase)
└── [선언문 블록 × 5] .m-line-wrap
    ├── border-top: 0.5px rgba(N700, 0.18)
    ├── padding: 28px 0 36px
    ├── .m-header (index + 선언문 텍스트, 26px)
    └── .m-content-slot (사진 or 장문 텍스트 — 선택적)
        margin-left: 38px (index 너비만큼 들여쓰기)
우측 스크롤 인디케이터 (position: absolute right)
├── 1px 수직 트랙 (rgba N700 0.12)
└── W400 thumb (32px, 스크롤 진행도 반영)
```

### 스크롤 인터랙션 구현

- `IntersectionObserver`로 각 `.m-line-wrap`이 viewport 진입 감지
- 진입 시: hidden → active 전환
- 벗어날 때(위로): active → revealed 전환
- 섹션 전체 높이: 콘텐츠 양에 따라 자동 (min-height 설정 불필요)

---

## 섹션 3 — How it works

### 개요
N50 배경. 서비스 파이프라인 4단계를 수직 플로우로 시각화.
각 스텝 우측에 실제 앱 스크린샷 이미지 배치.

### 섹션 헤더
```
eyebrow: "— How it works"  (N500, 11px, uppercase)
title:   "하루의 감정이 향이 되기까지"  (N700, 26px, font-weight 500)
```

### 스텝 데이터

| # | 태그 | 제목 | 설명 |
|---|------|------|------|
| 01 | 매일 | 일기를 씁니다 | 오늘 하루 있었던 일, 느꼈던 감정을 자유롭게 기록해요. 감정 태그로 그날의 기분을 더할 수 있어요. |
| 02 | 월말 자동 | AI가 감정을 분석합니다 | 한 달간 쌓인 일기에서 감정·감각·형용사 키워드를 추출하고 패턴을 찾아냅니다. |
| 03 | 50가지 어코드 | 향 레시피가 완성됩니다 | 추출된 키워드를 50개 향 어코드 DB와 매칭해 탑·미들·베이스 노트로 구성된 나만의 레시피를 만들어요. |
| 04 | 12개월 기록 | 향 리포트로 아카이빙됩니다 | 그 달의 향수가 완성되어 아카이브에 저장됩니다. 12개의 향수병이 하나씩 채워져 가요. |

### 레이아웃 구조

```
HowItWorksSection (N50 배경)
├── 섹션 헤더 (mb: 56px)
└── .step-list (position: relative)
    ├── .step-connector (position: absolute, left: 15px)
    │   └── .step-connector-fill (W400, 스크롤 진행도 반영)
    └── [스텝 × 4] .step-item
        ├── grid: 32px 1fr 120px
        ├── .step-num (원형, 상태별 색상)
        ├── .step-body (태그 + 제목 + 설명)
        └── .step-visual (앱 스크린샷 — 폰 베젤 프레임)
```

### 스텝 번호 상태

| 상태 | 배경 | 텍스트 |
|------|------|--------|
| done | W400 | N700 |
| active | N700 | W400 |
| upcoming | N200 | N500 |

### 스크롤 인터랙션
- IntersectionObserver로 각 `.step-item` 진입 감지
- 진입 시: upcoming → active, 이전 스텝 → done
- `.step-connector-fill` height를 현재 진행 스텝에 맞게 업데이트

### 앱 스크린샷 슬롯
- 폰 베젤: N700, border-radius 18px, 너비 약 120px
- 현재는 와이어프레임 — 실제 스크린샷 이미지로 교체 예정
- 각 스텝별 다른 앱 화면 필요 (기획팀에서 스크린샷 제공)

---

## 섹션 4 — Brand Story

### 개요
W200 배경. 감성 파트 + 기술 비전 파트 2개로 구성. 세로로 이어지며 border-bottom으로 구분.

### 파트 1 — 감성 (Why we started)
```
레이아웃: 2컬럼 grid (1fr 1fr)
좌측:
  eyebrow: "— Why we started"
  heading: "누구나 자신만의 인생의 향기가 있다"
  body: 창업 계기 카피
  AccentPanel: "모든 사람은 자신만의 향을 가질 자격이 있다."

우측: 5감 카드
  시각 / 청각 / 촉각 / 미각 → 기본 카드 (White 배경)
  후각 → W400 하이라이트 카드 (가장 덜 탐구된 감각)
```

### 파트 2 — 기술 비전 (Where we're going)
```
레이아웃: 헤더 + 3열 카드 그리드 + footer 메시지
heading: "향을 데이터로 만들면 세상이 달라집니다"
비전 카드 3개:
  01. 초개인화 향 서비스
  02. 심리 치료 & 공간 설계
  03. 피지컬 AI의 기본 감각 → N700 featured 카드
footer: "NewNose는 앱 서비스가 아닙니다. 향의 언어를 만드는 첫 번째 데이터 인프라입니다."
  → N700 border, 투명 배경, W400 dot
```

---

## 섹션 5 — App CTA

### 개요
N400 배경. 담백하게 — 카피 + QR + 다운로드 버튼 + Footer 통합.

### 레이아웃 구조
```
AppCtaSection (N400 배경, padding 72px 52px 80px, center 정렬)
├── eyebrow: "— Start your scent journey"
├── headline: "오늘의 일기가 당신의 향이 됩니다."
│   → "당신의 향" border-bottom 3px W400
├── sub: "지금 시작하면 한 달 후, 처음으로 나만의 향 레시피를 받게 됩니다."
├── .cta-actions (QR + 수직 divider + 다운로드 버튼)
│   ├── QR 코드 블록 (White 배경, N700 border 1.5px, 72×72px)
│   │   → 실제 앱 다운로드 링크 QR로 교체 예정
│   ├── 구분선 (1px, rgba(N700, 0.2))
│   └── 버튼 블록
│       ├── <Button variant="primary"> Google Play에서 다운로드
│       └── 서브라벨: "Android · 무료"
└── Footer (border-top rgba(N700, 0.15))
    ├── 로고: "NewNose"
    ├── 링크: 개인정보처리방침 / 이용약관 / 문의하기
    └── 카피라이트: "© 2025 NewNose"
```

### 카피 의도
Hero 카피("당신의 하루를 향으로 번역합니다")와 수미상관 구조.
페이지 전체가 하나의 문장처럼 흘러가도록 의도됨.
