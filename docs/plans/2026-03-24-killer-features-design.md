# CenterOn 킬러 피처 5종 디자인

## 구현 기능 목록
1. 회원권/수강권 관리
2. 출석 체크
3. 수업 프로그램 관리
4. 매출/통계 대시보드
5. 회원 알림

---

## 1. 회원권/수강권 관리

### DB 스키마 (memberships 테이블)
- id, memberId, type (회차제/기간제), name (10회권, 1개월 등)
- totalCount (총 횟수, 회차제), remainingCount (잔여 횟수)
- startDate, endDate (시작/만료일)
- price (결제 금액), status (active/expired/paused)
- createdAt, updatedAt

### 페이지: /memberships
- 전체 수강권 목록 (회원별 그룹)
- 수강권 발급 다이얼로그 (회원 선택, 유형, 횟수/기간, 금액)
- 수강권 상태: 활성(Green), 만료(Red), 일시정지(Yellow)
- 잔여 횟수/잔여 일수 프로그레스 바
- 수업 완료 시 자동 차감

### 사이드바 메뉴 추가
- "수강권 관리" (Ticket 아이콘)

---

## 2. 출석 체크

### DB 스키마 (attendances 테이블)
- id, bookingId, memberId, instructorId
- checkInTime (출석 시각), method (manual/qr)
- createdAt

### 페이지: /attendance
- 오늘 수업 목록 (시간순)
- 각 수업의 예약 회원 리스트
- 출석 버튼 (체크인/체크아웃)
- 출석 시 수강권 잔여 횟수 자동 차감
- 출석 통계: 오늘 출석률, 주간 출석률

### 회원 상세 페이지에 출석 이력 탭 추가

---

## 3. 수업 프로그램 관리

### DB 스키마 (programs 테이블)
- id, name (요가 기초반, 필라테스 중급반 등)
- description, category (yoga/pilates/pt/group)
- duration (수업 시간, 분), capacity (최대 인원)
- color (시간표 표시 색상)
- isActive, createdAt

### 페이지: /programs
- 프로그램 카드 목록 (카테고리별 탭)
- 프로그램 등록/수정 다이얼로그
- 카테고리: 요가, 필라테스, PT, 그룹수업
- 각 프로그램에 담당 강사 지정 가능
- 수업 시간표 연동 (캘린더에 프로그램명 표시)

---

## 4. 매출/통계 대시보드

### 페이지: /analytics
- **매출 차트** (월별 바 차트, CSS 순수 구현)
  - 수강권 판매 매출
  - 월별 비교
- **회원 증감 차트** (라인 차트)
  - 신규 가입 vs 이탈
- **강사별 실적** (테이블 + 바)
  - 수업 횟수, 매출 기여, 출석률
- **인기 프로그램** (도넛 차트)
  - 프로그램별 예약 비율
- 기간 필터: 이번 달 / 최근 3개월 / 올해

---

## 5. 회원 알림

### 페이지: /notifications (설정)
- 알림 유형 on/off 토글:
  - 수업 리마인더 (수업 1시간 전)
  - 수강권 만료 임박 (3일 전, 7일 전)
  - 수강권 잔여 횟수 부족 (3회 이하)
  - 생일 축하
- 알림 발송 이력 테이블
- 알림 템플릿 편집

### 알림 인프라 (Phase 1: 인앱 알림)
- notifications 테이블: id, userId, type, title, message, isRead, createdAt
- 헤더에 알림 벨 아이콘 + 안 읽은 수 뱃지
- 알림 드롭다운 패널
- Phase 2 (추후): 카카오 알림톡, SMS 연동

---

## 기술 접근
- Mock 데이터 모드 지원 (모든 기능)
- 기존 Drizzle ORM 패턴 유지
- 기존 TanStack Query 훅 패턴 유지
- CenterOn 컬러 스킴 적용
- 사이드바 메뉴 확장
