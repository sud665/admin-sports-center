# Supabase Auth 전환 디자인

## 개요

- **목표**: NextAuth → Supabase Auth 완전 전환, 카카오/구글 OAuth 추가
- **범위**: 인증만 교체, DB(Drizzle ORM)는 유지
- **OAuth**: 카카오 + 구글 (Supabase 네이티브)
- **이메일**: Supabase Auth 이메일/비밀번호
- **요금**: Supabase 무료 플랜

## 아키텍처

### 제거
- `next-auth` 패키지
- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/types/next-auth.d.ts`
- `SessionProvider` (providers.tsx에서)
- 모든 `useSession()` 호출

### 추가 파일
```
src/lib/supabase/client.ts    — createBrowserClient
src/lib/supabase/server.ts    — createServerClient (cookies)
src/lib/supabase/middleware.ts — createServerClient (req/res)
src/middleware.ts              — 세션 리프레시 + 보호 라우트
src/app/auth/callback/route.ts — OAuth 콜백
src/lib/hooks/use-auth.ts     — useAuth() 훅
```

### 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 사용자 연동 (Auth ↔ DB)
- Supabase Auth `auth.users.id` = Drizzle `users.id`
- 첫 로그인 시 users 테이블에 자동 INSERT (role: "admin")
- `useAuth()` 훅이 Supabase 세션 + DB 사용자 정보 통합 제공

## 로그인 UI
- 기존 스플릿 레이아웃 유지
- 소셜 버튼: 카카오(노란색) + 구글(흰색) 추가
- 구분선 "또는" 아래에 이메일/비밀번호 폼
- 회원가입 링크

## 미들웨어 보호 라우트
- `/dashboard/*`, `/calendar/*`, `/members/*` 등 → 미인증 시 `/login`으로 리다이렉트
- `/login`, `/register` → 인증 시 `/dashboard`로 리다이렉트
- `/` (랜딩) → 보호 없음
