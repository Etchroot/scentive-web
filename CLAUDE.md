# CLAUDE.md — Scentive 웹사이트 공통 규칙

> 작업 전 반드시 읽으세요. 섹션별 기획·스펙은 `planning.md`를 참조하세요.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | Scentive (센티브) |
| 웹사이트 성격 | 앱 서비스를 만든 기업/팀 소개 웹사이트 |
| 핵심 카피 | "당신의 하루를 향으로 번역해드립니다." |
| 플랫폼 | 웹 (반응형, Android 앱 다운로드 유도) |

---

## 2. 컬러 시스템

> 아래 CSS 변수만 사용합니다. HEX 하드코딩 금지.

```css
:root {
  --color-bg-warm:     #FFF7E1;
  --color-bg-neutral:  #FAFAFA;
  --color-bg-impact:   #CACACA;

  --color-point:       #FFDD82; /* 메인 포인트 — 소면적 강조 전용 */
  --color-accent:      #FFC62B;

  --color-text-primary:   #1F1F1F;
  --color-text-secondary: #4B4B4B;
  --color-text-muted:     #8E8E8E;

  --color-border-strong:  #1F1F1F;
  --color-border-default: #E1E1E1;
  --color-border-light:   #EEEEEE;
}
```

**사용 금지**
- `--color-point` (#FFDD82) → 섹션 전체 배경 사용 금지 (버튼·태그·라인 등 소면적만)
- `--color-text-primary` (#1F1F1F) → 섹션 전체 배경 사용 금지

---

## 3. Navbar

| 항목 | 값 |
|------|----|
| 배경 | `#FFFFFF` |
| 하단 구분선 | `1px solid #1F1F1F` |
| 포지션 | `sticky top: 0`, `z-index: 100` |
| 높이 | `56px` |
| 링크 1 | 서비스 → `#how-it-works` 섹션 스크롤 |
| 링크 2 | 스토리 → `#brand-story` 섹션 스크롤 |
| 링크 3 | 감정-향 지도 → `https://janhyang-1e4bc.web.app` · `target="_blank"` · 외부 링크 |
| 우측 CTA | `<Button variant="primary">앱 다운로드</Button>` |

> Navbar 배경은 White 고정. 다른 색으로 변경 금지.

---

## 4. 컴포넌트 시스템

> 인라인 스타일 반복 작성 금지. 아래 컴포넌트를 우선 사용하세요.

```
components/
├── layout/
│   ├── SectionWrapper   # bgType: 'warm' | 'neutral' | 'impact'
│   └── Container        # 최대 너비 + 좌우 패딩
├── ui/
│   ├── Button           # variant: 'primary' | 'outline' | 'ghost'
│   ├── Tag              # 소형 레이블 (W400 배경)
│   ├── Divider          # strong(N700) | default(N300)
│   └── AccentPanel      # border-left N700 강조 패널
├── sections/
│   ├── HeroSection
│   ├── ManifestoSection
│   ├── HowItWorksSection
│   ├── BrandStorySection
│   └── AppCtaSection
└── common/
    ├── Navbar
    └── Footer
```

**Button variant 규칙**
- `primary` — `--color-point` 배경, `--color-text-primary` 텍스트, hover → `--color-accent`
- `outline` — 투명 배경, `--color-border-strong` border, hover → bg-warm
- `ghost` — 텍스트만, 하단 밑줄, hover → text-primary

---

## 5. 타이포그래피

- 헤딩: 크고 대담하게, line-height 1.1~1.2
- 본문: 16px, line-height 1.7
- 캡션/레이블: 11px, letter-spacing 0.1em, uppercase
- **금지**: Inter, Roboto, Arial, system-ui 단독 사용 금지

---

## 6. 배포 환경

| 항목 | 내용 |
|------|------|
| 호스팅 | Firebase Hosting · 프로젝트명 `Janhyang` |
| 레포지토리 | GitHub · `scentive-web` |
| 자동 배포 | GitHub Actions → `main` 브랜치 push 시 Firebase 자동 배포 |
| 배포 명령 | `firebase deploy --only hosting` |

**설정 파일 체크**
- `firebase.json` — public 디렉토리, rewrites 설정 (SPA라면 `"destination": "/index.html"`)
- `.github/workflows/firebase-deploy.yml` — GitHub Actions 자동 배포 워크플로우
- `.firebaserc` — 프로젝트 `Janhyang` 연결 확인

---

## 7. 작업 전 체크리스트

- [ ] `planning.md`에서 해당 섹션 스펙 확인했는가?
- [ ] CSS 변수를 HEX 하드코딩 없이 사용하는가?
- [ ] `--color-point`를 대면적 배경으로 쓰지 않는가?
- [ ] `--color-text-primary`를 섹션 배경으로 쓰지 않는가?
- [ ] 이미 존재하는 컴포넌트를 새로 만들지 않는가?
- [ ] 금지 폰트(Inter 등)를 사용하지 않는가?
- [ ] Navbar CTA 외에 별도 앱 다운로드 버튼을 Hero에 추가하지 않는가?
