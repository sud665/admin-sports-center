# CenterOn 랜딩페이지 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 필라테스/요가/헬스 센터 원장님 대상 서비스 홍보 랜딩페이지를 루트(`/`)에 구현

**Architecture:** 기존 Next.js App Router 프로젝트의 루트 페이지를 랜딩으로 교체. 랜딩 전용 컴포넌트를 `src/components/landing/`에 구성하고, Framer Motion으로 스크롤 기반 애니메이션 구현. 기존 대시보드(`/dashboard`)는 변경 없이 유지.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion, Unsplash 이미지 (직접 URL)

---

### Task 1: 프로젝트 셋업 — Framer Motion 설치 및 CenterOn 컬러 토큰 추가

**Files:**
- Modify: `package.json`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (metadata 업데이트)

**Step 1: Framer Motion 설치**

Run: `npm install framer-motion`

**Step 2: globals.css에 CenterOn 컬러 변수 추가**

`src/app/globals.css`의 `:root` 블록 안에 추가:

```css
/* CenterOn Landing Colors */
--centeron-black: #080708;
--centeron-blue: #3772FF;
--centeron-red: #DF2935;
--centeron-yellow: #FDCA40;
--centeron-grey: #E6E8E6;
```

**Step 3: layout.tsx 메타데이터 업데이트**

`src/app/layout.tsx`의 metadata를 변경:

```tsx
export const metadata: Metadata = {
  title: "CenterOn - 센터 운영을 켜다",
  description: "필라테스 · 요가 · 헬스 센터 통합 관리. 강사 일정, 회원 관리, 급여 정산까지 하나로.",
  icons: {
    icon: "/favicon.svg",
  },
};
```

**Step 4: 빌드 확인**

Run: `npm run build`
Expected: 성공

**Step 5: Commit**

```bash
git add package.json package-lock.json src/app/globals.css src/app/layout.tsx
git commit -m "chore: framer-motion 설치 및 CenterOn 컬러 토큰 추가"
```

---

### Task 2: SVG 로고 및 파비콘 생성

**Files:**
- Create: `public/favicon.svg`
- Create: `src/components/landing/centeron-logo.tsx`

**Step 1: 파비콘 SVG 생성**

`public/favicon.svg` — 전원 버튼 심볼을 모티브로 한 미니멀 아이콘. Blue `#3772FF` 원형에 전원 심볼.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#3772FF"/>
  <path d="M16 6v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <path d="M10.5 9.5a9 9 0 1 0 11 0" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>
```

**Step 2: 로고 컴포넌트 생성**

`src/components/landing/centeron-logo.tsx` — "CenterOn" 텍스트 + 전원 아이콘 인라인 SVG 조합. props로 `className`, `size` 받음.

```tsx
"use client";

export function CenterOnLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-6", md: "h-8", lg: "h-10" };
  const textSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg className={sizeMap[size]} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="15" fill="#3772FF"/>
        <path d="M16 6v10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M10.5 9.5a9 9 0 1 0 11 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
      </svg>
      <span className={`${textSize[size]} font-bold tracking-tight text-white`}>
        Center<span className="text-[#3772FF]">On</span>
      </span>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add public/favicon.svg src/components/landing/centeron-logo.tsx
git commit -m "feat: CenterOn SVG 로고 및 파비콘 생성"
```

---

### Task 3: 네비게이션 바 컴포넌트

**Files:**
- Create: `src/components/landing/landing-nav.tsx`

**Step 1: 고정 상단 네비게이션 바 구현**

`src/components/landing/landing-nav.tsx`:
- 스크롤 시 배경 블러 + 반투명 다크 전환 (useState + scroll 이벤트)
- 좌: CenterOnLogo
- 우: 앵커 링크 (`기능`, `리뷰`, `시작하기`) + `로그인` 버튼 (Link to `/login`)
- 모바일: 햄버거 메뉴 (sheet 또는 자체 구현)
- `"use client"` 컴포넌트
- Framer Motion `motion.nav`로 초기 등장 애니메이션

**Step 2: Commit**

```bash
git add src/components/landing/landing-nav.tsx
git commit -m "feat: 랜딩 네비게이션 바 컴포넌트"
```

---

### Task 4: Hero 섹션

**Files:**
- Create: `src/components/landing/hero-section.tsx`

**Step 1: Hero 섹션 구현**

`src/components/landing/hero-section.tsx`:
- 풀스크린 (100vh) 컨테이너
- Unsplash 필라테스/요가 배경 이미지 2~3장 자동 페이드 전환 (5초 간격, `AnimatePresence`로 전환)
- 다크 오버레이 70%
- Ken Burns 줌인 효과 (CSS `@keyframes` scale 1→1.1, 15초)
- 텍스트 좌측 하단 비대칭 배치:
  - 서브: `필라테스 · 요가 · 헬스 센터 통합 관리` (Yellow)
  - 메인: `센터 운영,\n이제 켜기만 하세요.` (White, "켜기"에 Blue span)
  - 설명: `강사 일정, 회원 관리, 급여 정산까지 하나로` (Grey)
- CTA 버튼: "30일 무료 체험" (Blue 배경), hover 스케일업
- 아래 "신용카드 없이 바로 시작"
- 하단 스크롤 유도 화살표 바운스
- Framer Motion: 텍스트 stagger 등장 (아래→위, 0.2초 간격)

Unsplash 이미지 URL 예시 (무료, 직접 링크):
```
https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1920&q=80
https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1920&q=80
https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1920&q=80
```

**Step 2: Commit**

```bash
git add src/components/landing/hero-section.tsx
git commit -m "feat: Hero 섹션 — 풀스크린 이미지 슬라이더 + 스태거 모션"
```

---

### Task 5: Pain Point 섹션

**Files:**
- Create: `src/components/landing/pain-point-section.tsx`

**Step 1: Pain Point 섹션 구현**

`src/components/landing/pain-point-section.tsx`:
- 배경: Black `#080708`
- 3개 카드 비대칭 배치 (각각 rotate -2deg, 1deg, -1deg, 높이 엇갈림)
- 카드 사이 Red 대각선 스트라이프 장식 (CSS background repeating-linear-gradient)
- 카드 내용:
  1. 클립보드 SVG 아이콘 + "엑셀로 일정 관리, 아직도?" + 설명
  2. 돈 SVG 아이콘 + "정산할 때마다 야근" + 설명
  3. 얼굴 SVG 아이콘 + "회원이 늘수록 혼란도 늘고" + 설명
- 하단: "이제 다른 방법이 있습니다" (Yellow, 페이드인)
- 웨이브 디바이더 SVG (섹션 하단)
- Framer Motion:
  - `useInView` + `motion.div`로 카드 회전하며 좌/우 교차 등장 (stagger 0.3초)
  - hover: 기울기 0도 + scale 1.05

**Step 2: Commit**

```bash
git add src/components/landing/pain-point-section.tsx
git commit -m "feat: Pain Point 섹션 — 비대칭 카드 + 회전 등장 모션"
```

---

### Task 6: Features 섹션

**Files:**
- Create: `src/components/landing/features-section.tsx`

**Step 1: Features 섹션 구현**

`src/components/landing/features-section.tsx`:
- 배경: Grey `#E6E8E6`
- 4개 기능 블록 지그재그 배치
- 각 블록:
  - 컬러 포인트 세로 바 (4px)
  - 반투명 대형 숫자 `01`~`04` 배경
  - 제목, 설명 텍스트
  - 기울어진 카드 위 스크린샷 이미지 (CSS로 목업 카드 생성, 실제 스크린샷 대신 일러스트레이션 스타일 플레이스홀더)
- 기능:
  1. "한눈에 보는 캘린더" (Blue) — Lucide CalendarDays 아이콘
  2. "자동 급여 정산" (Yellow) — Lucide Calculator 아이콘
  3. "회원 · 강사 통합 관리" (Red) — Lucide Users 아이콘
  4. "강사도 직접 확인" (Blue) — Lucide Smartphone 아이콘
- Framer Motion:
  - 텍스트: 좌/우 슬라이드인 (`variants` + `useInView`)
  - 이미지: 아래→위 + rotate
  - 숫자: scale 0→1 팝인

**Step 2: Commit**

```bash
git add src/components/landing/features-section.tsx
git commit -m "feat: Features 섹션 — 지그재그 레이아웃 + 슬라이드 모션"
```

---

### Task 7: Screenshot 섹션

**Files:**
- Create: `src/components/landing/screenshot-section.tsx`

**Step 1: Screenshot 섹션 구현**

`src/components/landing/screenshot-section.tsx`:
- 배경: Black→Blue 그라데이션 (135deg)
- 중앙 브라우저 목업:
  - 상단 바: 3개 원형 버튼 (red, yellow, green) + 주소창 바
  - CSS perspective + rotateX(5deg) 원근감
  - 내부: 대시보드 UI를 CSS로 간략 재현 (또는 placeholder 이미지)
- 핫스팟 3개: 펄스 애니메이션 원형 포인트, 클릭/hover 시 말풍선 (Framer Motion `AnimatePresence`)
- 좌우 플로팅 뱃지: "다크모드 지원", "모바일 반응형" — 부유 애니메이션 (y축 반복)
- Framer Motion:
  - 목업: 아래→위 + perspective 등장
  - 뱃지: floating (y: [0, -10, 0] infinite)

**Step 2: Commit**

```bash
git add src/components/landing/screenshot-section.tsx
git commit -m "feat: Screenshot 섹션 — 브라우저 목업 + 핫스팟 인터랙션"
```

---

### Task 8: Reviews 섹션

**Files:**
- Create: `src/components/landing/reviews-section.tsx`

**Step 1: Reviews 섹션 구현**

`src/components/landing/reviews-section.tsx`:
- 배경: Grey `#E6E8E6`
- 타이틀: "센터온과 함께하는 원장님들" (좌측 정렬) + Yellow 별점 장식
- 카드 3개 비대칭 (가운데 카드 살짝 위로 -translateY)
- 각 카드:
  - White 배경, 둥근 모서리, 큰 그림자
  - 큰 따옴표 장식 (컬러 포인트)
  - 리뷰 텍스트
  - 강조 수치 뱃지 (우상단)
  - 하단: Unsplash 아바타 원형 + 이름 + 센터 유형
- 리뷰 데이터:
  1. 김지현 원장 / 필라테스 / "정산 3시간→10분" (Yellow)
  2. 박수진 원장 / 요가 / "전화 문의 90% 감소" (Blue)
  3. 이동훈 원장 / 헬스&PT / "회원 200명+ 관리" (Red)
- Unsplash 아바타 URL:
  ```
  https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face
  https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face
  https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face
  ```
- Framer Motion:
  - stagger 팝업 (0.2초 간격)
  - hover: translateY -8px + 그림자 확대
  - 수치 카운트업 (useInView 트리거)

**Step 2: Commit**

```bash
git add src/components/landing/reviews-section.tsx
git commit -m "feat: Reviews 섹션 — 비대칭 리뷰 카드 + 카운트업 모션"
```

---

### Task 9: CTA 섹션

**Files:**
- Create: `src/components/landing/cta-section.tsx`

**Step 1: CTA 섹션 구현**

`src/components/landing/cta-section.tsx`:
- 배경: Black `#080708` + Blue/Red 그라데이션 원형 블러 장식 (CSS radial-gradient + blur + absolute)
- 좌측 60%:
  - 서브: "30일 무료, 부담 없이" (Yellow)
  - 메인: "지금 센터를\n켜보세요." (White 대형)
  - 체크리스트: ✓ 신용카드 불필요 / ✓ 전 기능 무료 / ✓ 1분이면 시작
- 우측 40%:
  - 반투명 다크 카드 (backdrop-blur)
  - 폼: 센터명, 이름, 이메일, 전화번호 (shadcn Input 재활용)
  - 제출 버튼: "무료로 시작하기" (Yellow 배경, Black 텍스트)
  - hover: 글로우 효과 (box-shadow Yellow 확산)
- 폼 제출: `useState`로 성공 상태 관리, 제출 시 축하 메시지 전환
- Framer Motion:
  - 좌측 좌→우 슬라이드, 우측 우→좌 슬라이드
  - 배경 블러 원형 느린 floating
  - 성공 시 `AnimatePresence` 전환

**Step 2: Commit**

```bash
git add src/components/landing/cta-section.tsx
git commit -m "feat: CTA 섹션 — 무료 체험 신청 폼 + 글로우 모션"
```

---

### Task 10: Footer 컴포넌트

**Files:**
- Create: `src/components/landing/landing-footer.tsx`

**Step 1: Footer 구현**

`src/components/landing/landing-footer.tsx`:
- 배경: Black `#080708`
- 상단: Yellow 얇은 구분선
- 3컬럼 비대칭:
  - 좌: CenterOnLogo + "센터 운영을 켜다"
  - 중: 앵커 링크 (기능, 리뷰, 로그인, 이용약관, 개인정보처리방침)
  - 우: 연락처 (이메일, 전화)
- 하단: `© 2025 CenterOn. All rights reserved.` (Grey, 작게)
- 모바일: 1컬럼 스택

**Step 2: Commit**

```bash
git add src/components/landing/landing-footer.tsx
git commit -m "feat: 랜딩 Footer 컴포넌트"
```

---

### Task 11: 랜딩 페이지 조립 및 라우팅 변경

**Files:**
- Modify: `src/app/page.tsx` (redirect 제거 → 랜딩 페이지로 교체)
- Create: `src/app/(landing)/page.tsx` (또는 루트 page.tsx 직접 변경)

**Step 1: 루트 page.tsx를 랜딩 페이지로 교체**

`src/app/page.tsx`:

```tsx
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { PainPointSection } from "@/components/landing/pain-point-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ScreenshotSection } from "@/components/landing/screenshot-section";
import { ReviewsSection } from "@/components/landing/reviews-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <PainPointSection />
      <FeaturesSection />
      <ScreenshotSection />
      <ReviewsSection />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
```

**Step 2: 기존 대시보드 리다이렉트 확인**

`src/app/(dashboard)/dashboard/page.tsx`가 이미 존재하므로 `/dashboard`로 직접 접근 가능. 로그인 후 대시보드로의 리다이렉트는 NextAuth 설정에서 처리됨.

**Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공, 0 에러

**Step 4: 개발 서버에서 시각 확인**

Run: `npm run dev`
브라우저에서 `http://localhost:3000` 접속 → 랜딩 페이지 표시 확인
`http://localhost:3000/dashboard` → 기존 대시보드 표시 확인

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: 루트 페이지를 CenterOn 랜딩으로 교체"
```

---

### Task 12: 최종 린트 및 빌드 검증

**Files:**
- 전체 프로젝트

**Step 1: 린트 실행**

Run: `npm run lint`
Expected: 0 에러

**Step 2: 빌드 실행**

Run: `npm run build`
Expected: 성공

**Step 3: 에러 수정 (필요 시)**

린트 또는 빌드 에러 발생 시 해당 파일 수정

**Step 4: 최종 Commit**

```bash
git add -A
git commit -m "chore: 랜딩페이지 린트 및 빌드 검증 완료"
```
