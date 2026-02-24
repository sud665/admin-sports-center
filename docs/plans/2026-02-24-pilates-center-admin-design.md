# 필라테스 센터 관리 시스템 - 설계 문서

> 작성일: 2026-02-24

## 1. 프로젝트 개요

필라테스 센터 내부에서 사용할 강사 스케줄 예약 및 급여 정산 관리 시스템.
수기/구글 캘린더 관리를 전산화하여 예약 중복 방지 및 급여 정산 자동화가 목표.

### 핵심 요구사항

- 관리자(센터장): 강사/회원/예약/정산 전체 관리
- 강사: 본인 스케줄 확인 + 가능 시간 등록 + 본인 정산 조회
- 동시간대 강사 1인당 최대 6명 예약 제한
- 수업 50분 고정, 유형 구분 없음
- 정산: SUM(수업 수강료) × 강사 요율(%), `completed` 상태만 포함
- 수강료는 관리자가 예약 시 직접 입력
- PC 웹 + 모바일 웹 (반응형)

## 2. 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| Framework | Next.js 14+ (App Router) | 풀스택, SSR, API Routes |
| UI | shadcn/ui + Tailwind CSS | Admin 스타일 최적화 |
| 캘린더 | FullCalendar | 드래그앤드롭, 강사별 색상, 주간/월간 뷰 |
| ORM | Drizzle ORM | 타입 안전, 가볍고 SQL에 가까운 문법 |
| DB | Supabase PostgreSQL | 무료 티어, 관리형 DB |
| 인증 | NextAuth.js (Credentials) | 이메일/비밀번호, 역할 관리 |
| 배포 | Vercel (앱) + Supabase (DB) | 무료/저비용 운영 |
| 상태관리 | TanStack Query | 서버 상태 관리, 캐싱 |

### 아키텍처

```
[브라우저] <-> [Next.js App (Vercel)]
                 ├── App Router (페이지)
                 ├── API Routes (/api/*)
                 ├── NextAuth.js (인증)
                 └── Drizzle ORM
                        ↓
             [Supabase PostgreSQL]
```

## 3. 데이터베이스 스키마

### users (관리자 + 강사)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| email | varchar | 로그인 이메일 |
| password_hash | varchar | bcrypt 해시 |
| name | varchar | 이름 |
| role | enum('admin', 'instructor') | 역할 |
| color | varchar | 강사별 고유 색상 (hex) |
| rate | decimal | 정산 요율 (%) |
| is_active | boolean | 활성 상태 |
| created_at | timestamp | |
| updated_at | timestamp | |

### members (회원)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | varchar | 회원 이름 |
| phone | varchar | 연락처 |
| instructor_id | uuid (FK → users) | 담당 강사 |
| memo | text | 메모 |
| is_active | boolean | 활성 상태 |
| created_at | timestamp | |
| updated_at | timestamp | |

### bookings (예약)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| instructor_id | uuid (FK → users) | 담당 강사 |
| member_id | uuid (FK → members) | 수강 회원 |
| date | date | 수업 날짜 |
| start_time | time | 수업 시작 시간 |
| end_time | time | 수업 종료 시간 (자동: +50분) |
| price | integer | 수강료 (원 단위) |
| status | enum('booked', 'completed', 'cancelled') | 예약 상태 |
| created_at | timestamp | |
| updated_at | timestamp | |

### available_slots (강사 수업 가능 시간)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| instructor_id | uuid (FK → users) | 강사 |
| day_of_week | integer (0-6) | 요일 |
| start_time | time | 가능 시작 시간 |
| end_time | time | 가능 종료 시간 |
| is_recurring | boolean | 매주 반복 여부 |
| created_at | timestamp | |

### 핵심 제약 조건

- 동시간대 6명 제한: `SELECT COUNT(*) ... FOR UPDATE` 트랜잭션으로 동시성 제어
- 정산 쿼리: `SUM(b.price) * u.rate / 100` (status='completed'만 포함)

## 4. 페이지 구조

### 관리자 페이지

```
/login                → 로그인
/dashboard            → 대시보드 (오늘 예약 현황, 요약)
/calendar             → 캘린더 (주간/월간, 전체 강사)
/bookings/new         → 예약 등록
/instructors          → 강사 목록
/instructors/[id]     → 강사 상세
/members              → 회원 목록
/members/[id]         → 회원 상세
/settlements          → 정산 관리
/settlements/[id]     → 강사별 정산 상세
/settings             → 설정
```

### 강사 페이지

```
/login                → 로그인
/dashboard            → 내 대시보드
/calendar             → 내 캘린더
/my-slots             → 수업 가능 시간 관리
/my-settlements       → 내 정산 조회
```

### 레이아웃

- PC: 좌측 사이드바 고정 + 우측 콘텐츠
- 모바일: 햄버거 메뉴, 캘린더 주간 뷰 기본
- 사이드바 메뉴는 role에 따라 동적 렌더링

## 5. API Routes

```
/api/auth/[...nextauth]   → 인증
/api/instructors          → 강사 CRUD (admin)
/api/members              → 회원 CRUD (admin, instructor: 본인 담당)
/api/bookings             → 예약 CRUD + 6명 제한 체크
/api/slots                → 가능 시간 CRUD (instructor 본인)
/api/settlements          → 정산 조회 (admin: 전체, instructor: 본인)
```

### 권한 체크

- NextAuth 세션 → role 확인
- admin: 모든 API 접근
- instructor: 본인 데이터만 접근 (instructor_id === session.user.id)

### 에러 처리

| 상황 | HTTP | 메시지 |
|------|------|--------|
| 미인증 | 401 | 로그인 필요 |
| 권한 없음 | 403 | 접근 권한 없음 |
| 6명 초과 | 409 | 해당 시간대 예약 가득 참 |
| 가능 시간 외 | 400 | 강사 수업 가능 시간 아님 |
| 리소스 없음 | 404 | 데이터 없음 |

## 6. 개발 범위

### 1차 (MVP)

1. 프로젝트 셋업 (Next.js + Drizzle + Supabase + shadcn/ui, 인증)
2. 강사 관리 (CRUD, 색상/요율)
3. 회원 관리 (CRUD, 담당 강사 매핑)
4. 캘린더 & 예약 (FullCalendar, DnD, 6명 제한)
5. 가능 시간 관리 (강사별 슬롯)
6. 정산 (월별 조회, 상세 내역)
7. 대시보드 (오늘 현황, 요약)
8. 반응형 (모바일 웹)

### 2차 (고도화) - 이번 범위 제외

- 카카오톡 알림톡
- PG 결제
- 회원 포털 (직접 예약/취소)
- 통계/리포트
- 정산 확정/엑셀 내보내기
