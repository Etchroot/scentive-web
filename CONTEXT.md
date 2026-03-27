# CONTEXT.md — 작업 맥락 & 구현 노하우

> CLAUDE.md(규칙), task.md(스펙), planning.md(기획)에 담기지 않은 **구현 배경·판단 근거·삽질 기록**을 모아둔 문서.
> 다른 환경에서 이어 작업할 때 반드시 읽어주세요.

---

## 1. 네이밍 규칙 (확정)

| 대상 | 이름 | 비고 |
|------|------|------|
| 앱 서비스명 | **잔향** (Janhyang) | 사용자에게 보이는 앱 이름 |
| 회사명 | **(주)뉴노즈** / **NewNose** | 법적 주체, Footer·약관에 표시 |
| 코드 내 브랜드 | **NEWNOSE** | Navbar 로고, 워터마크 패턴, Copyright |
| ~~SCENTIVE / 센티브~~ | **사용 금지** | 전량 제거 완료. 코드·번역·문서 어디에도 없어야 함 |

> `CLAUDE.md`의 서비스명 `NewNose (센티브)` 표기는 레거시 — 실제로는 위 규칙을 따를 것.

---

## 2. 기술 스택 제약

| 항목 | 사용 | 금지 |
|------|------|------|
| 스타일링 | **CSS Modules** (`.module.css`) | Tailwind CSS |
| 언어 | **JSX** (JavaScript) | TypeScript (TSX) |
| 애니메이션 | **motion/react** v12 (`motion`, `AnimatePresence`) | framer-motion (구버전 import) |
| 폰트 | Noto Sans KR, Cormorant Garamond | Inter, Roboto, Arial, system-ui 단독 |

> 외부 컴포넌트(Tailwind/TSX)를 가져올 때는 반드시 CSS Modules + JSX로 변환.

---

## 3. 섹션별 구현 핵심 & 주의사항

### 3-1. HeroSection (WebGL 잉크 시뮬레이션)

**Liquid Glass 효과** (감정 라벨):
- `backdrop-filter: blur(24px) saturate(1.4)` + 반투명 배경
- SVG gooey 필터 `#liquidGlass`: `feGaussianBlur(stdDeviation=6)` + `feColorMatrix`
- `::after` shimmer 애니메이션 (대각선 빛 스윕)
- 감정→향 전환 후에도 유리 효과 유지 필수:
  ```css
  .labelDone {
    background: color-mix(in srgb, var(--scent-color) 55%, transparent) !important;
    backdrop-filter: blur(24px) saturate(1.4) !important;
  }
  ```
- **55%** 투명도가 최적. 30%는 너무 약하고 70%+는 유리 느낌이 사라짐.

**중앙 안내 텍스트 박스**:
- 반드시 `background: #fff` 불투명 흰색. 투명하면 뒤 워터마크 텍스트가 비쳐 가독성 저하.

### 3-2. HowItWorksSection (3D 카드 스택 슬라이더)

**카드 스택 로직**:
- `getCardStyle(offset)`: offset 0=활성, ±1=바로 뒤/앞
- 비활성 카드: `scale: 1 - absOff * 0.06`, `y: absOff * 28px`, `rotateX: -3deg`
- spring 애니메이션: `stiffness: 260, damping: 26, mass: 0.8`
- 활성 카드만 drag 가능 (`drag="x"`, `dragElastic: 0.15`)

**GlowingEffect (테두리 글로우)**:
- `conic-gradient` 마스크 + CSS custom property `--start-angle`
- `motion/react`의 `animate()` 함수로 각도 보간 (React 컴포넌트가 아닌 imperative API)
- 활성 카드에만 `disabled={false}` — 비활성은 글로우 off

**크로스페이드 글로우 (배경)**:
- ~~CSS 변수로 색상 전환~~ → **안됨**. CSS는 custom property 값을 보간 못함.
- **해결책**: 카드별 고유 색상의 글로우 레이어를 전부 렌더링하고, `opacity: 0/1` 토글로 크로스페이드.
  ```jsx
  {STEP_META.map((meta, j) => (
    <div
      className={`${styles.bgGlow} ${j === activeIdx ? styles.bgGlowActive : ''}`}
      style={{ '--glow-color': meta.glowColor }}
    />
  ))}
  ```

**흔한 버그**: `STEP_META.indexOf(step)` → 번역 데이터와 merge된 객체는 원본 참조가 아니라 `-1` 반환. 반드시 `index`를 prop으로 직접 전달할 것.

### 3-3. BrandStorySection (에디토리얼 카드 + 글로우)

**두 종류의 글로우 시스템**:
1. Part1 (에디토리얼): 중앙 `radial-gradient` — `editorialIdx` 상태로 제어
2. Part2 (비전): 가장자리 `inset box-shadow` — `visionIdx` 상태로 제어

**호버 동작**: 마우스가 떠나도 마지막 호버 카드의 글로우 유지 (상태 초기화 안 함).

**이미지 효과**: `filter: grayscale(1)` → 호버 시 `grayscale(0)` + `scale(1.05)` 줌아웃

### 3-4. ManifestoSection (카드 플립 + 배경 영상)

**카드 플립 방향 주의**:
- 진입 애니메이션: **X축 회전** (스코어보드 스타일) `rotateX(180deg) → rotateX(0deg)`
- ~~호버 플립(Y축)과 혼합하면 backface-visibility 깨짐~~ → 호버 플립 제거함. 현재는 앞면에 번호+문장+desc 모두 표시.

**IntersectionObserver 방향 감지**:
```js
if (entry.isIntersecting) {
  setVisible(true);  // 뷰포트 진입 → 플립 인
} else if (entry.boundingClientRect.top > 0) {
  setVisible(false); // 뷰포트 아래로 벗어남 → 리셋
}
// 위로 지나간 카드(top < 0)는 visible 유지 — 되돌리지 않음
```

**배경 영상 루프**:
- `petals_mobile.mp4` 정방향 재생, `loop` 속성 미사용 (페이드 제어를 위해)
- `onTimeUpdate`에서 끝 1초 페이드아웃, 시작 1초 페이드인
- `onEnded`에서 opacity=0 설정 후 currentTime=0, play() 호출
- ~~역재생(rAF)~~ → 렉 심해서 포기
- ~~스크롤 연동 재생~~ → 끊김 심해서 포기
- ~~재생속도 0.8배~~ → 제거 (단순 정방향 루프로 확정)

**롤백 가능**: 배경 영상 제거 시 `<video>`, `<div className={styles.bgOverlay}>`, CSS의 `.bgVideo`/`.bgOverlay` 제거하면 원복.

### 3-5. ParticleCanvas (마우스 추적 입자)

**물리 모델**: 거리 무관 인력 `force = 0.6 / (1 + dist * 0.004)`
- ~~lerp 꼬리 추적~~ → "너무 꼬리처럼 따라다닌다"는 피드백으로 제거
- sin/cos drift로 뭉침 방지
- **Navbar 영역(상단 56px) 진입 금지**: `if (p.y < 56) p.y = 56`

**파티클 스펙**: 14개, 크기 3~11px, 12가지 색상 (따뜻한 갈색~골드~핑크~그린~블루~라벤더)

**렌더링**: Canvas 2D, `radial-gradient` 원형, 근접 파티클(<120px) 간 연결선

---

## 4. 외부 링크

| 대상 | URL |
|------|-----|
| 감정-향 지도 | `https://visualization-iota.vercel.app/` |
| 앱 다운로드 | `https://drive.google.com/drive/folders/10FYPt371_So8zH8Hr2OANEFgddIPXEMK` |
| 배포 사이트 | `https://janhyang-web.web.app` |
| 이메일 | `scentive@gmail.com` (이용약관 기재) / `contact@newnose.io` (Footer) |

> CLAUDE.md에 적힌 감정-향 지도 URL(`janhyang-1e4bc.web.app`)은 레거시. 위 URL이 최신.

---

## 5. 번역 시스템

- **원본**: `src/locales/ko.json` (단일 소스)
- **자동 생성**: `node scripts/translate.js` → en/ja/zh 생성 (Claude API 사용, `.env`에 `ANTHROPIC_API_KEY` 필요)
- ko.json 수정 후 반드시 번역 스크립트 실행할 것
- `manifesto.lines[].keyword` 필드: 해당 키워드를 노란색(`--color-point`)으로 하이라이트

---

## 6. 시도했다가 철회한 것들

| 시도 | 이유 | 결과 |
|------|------|------|
| 영상 역재생 (rAF로 currentTime 감소) | 프레임 단위 seek → 극심한 렉 | 정방향 재생으로 회귀 |
| 스크롤 연동 영상 재생 | 스크롤 이벤트 이산적 → 영상 뚝뚝 끊김 | 자동 재생 루프로 회귀 |
| rAF 보간으로 부드러운 스크롤 영상 | 여전히 끊김 체감 | 자동 재생 루프로 회귀 |
| CSS 변수 색상 보간 글로우 | CSS custom property는 transition 보간 불가 | 다중 레이어 opacity 크로스페이드 |
| lerp 기반 파티클 꼬리 추적 | "꼬리처럼 따라다닌다" 피드백 | 거리 무관 인력 모델 |
| 호버 시 카드 Y축 플립 (뒷면 desc) | X축 진입 애니메이션과 혼합 시 backface 깨짐 | 앞면에 desc 직접 표시 |
| 재생속도 0.8배 감속 | 불필요 판단, 단순화 | 1x 정방향 재생 |

---

## 7. CLAUDE.md와 실제 코드 차이 (레거시 주의)

CLAUDE.md는 초기에 작성되어 현재 코드와 다른 부분이 있음:

| CLAUDE.md 기재 | 실제 (최신) |
|---------------|------------|
| 서비스명 `NewNose (센티브)` | 앱=잔향, 회사=(주)뉴노즈 |
| 감정-향 지도 URL `janhyang-1e4bc.web.app` | `visualization-iota.vercel.app` |
| 컴포넌트 목록에 `Footer` 별도 존재 | `AppCtaSection.jsx` 내부 `Footer` 함수 |
| 컴포넌트 목록에 없음 | `GlowingEffect`, `ParticleCanvas` 추가됨 |
| Navbar 링크 순서 | 서비스→스토리→브랜드 철학→감정-향 지도 (현재) |
| `--container-max-width: 1200px` | `1600px`로 확대 |

> 코드를 수정할 때는 CLAUDE.md보다 이 문서(CONTEXT.md)와 실제 코드를 우선 참조.
