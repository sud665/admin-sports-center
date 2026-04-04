/**
 * CenterOn QA API Test Script (v2)
 * - @supabase/ssr 쿠키 포맷으로 인증
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = "https://mvxswltykcliqvilvofp.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12eHN3bHR5a2NsaXF2aWx2b2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzgxNTUsImV4cCI6MjA4NzUxNDE1NX0.n-FgSf4yy-1BKBoPb1XE9DrHLSbL83_5RhCSTFg71DQ";
const BASE_URL = "http://localhost:3001";

// 테스트 계정
const ADMIN_CREDS = { email: "qaadmin.centeron@gmail.com", password: "qatest1234" };
const INSTRUCTOR_CREDS = { email: "qa-instructor-1775333694718@example.com", password: "qatest1234" };

// 결과 추적
const results = { pass: 0, fail: 0, issues: [] };

function pass(label) {
  results.pass++;
  console.log(`  ✓ PASS ${label}`);
}

function fail(label, expected, actual, severity = "Major") {
  results.fail++;
  results.issues.push({ label, expected, actual, severity });
  console.log(`  ✗ FAIL ${label}`);
  console.log(`       기대: ${expected} | 실제: ${actual}`);
}

// @supabase/ssr 쿠키 포맷으로 세션 쿠키 생성
async function getSessionCookie(email, password) {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;

  const cookieStore = new Map();
  const serverClient = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => [...cookieStore.entries()].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => {
        if (value) cookieStore.set(name, value);
        else cookieStore.delete(name);
      }),
    },
  });

  await serverClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return [...cookieStore.entries()]
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
}

function getHeaders(cookieStr) {
  return {
    Cookie: cookieStr,
    "Content-Type": "application/json",
  };
}

async function apiCall(method, path, body, cookieStr) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookieStr ? { Cookie: cookieStr } : {}),
    },
    redirect: "manual",
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ─────────────────────────────────────
// 비인증 테스트
// ─────────────────────────────────────
async function testUnauthenticated() {
  console.log("\n━━━ [1] 비인증 접근 테스트 (모든 API → 401) ━━━");
  const endpoints = [
    "/api/dashboard", "/api/members", "/api/instructors",
    "/api/bookings", "/api/memberships", "/api/programs",
    "/api/slots", "/api/class-schedules", "/api/attendance",
    "/api/settlements", "/api/analytics", "/api/notifications",
  ];
  for (const ep of endpoints) {
    const r = await apiCall("GET", ep);
    if (r.status === 401) {
      pass(`GET ${ep} → 401`);
    } else {
      fail(`GET ${ep} 비인증 차단`, "401", r.status, "Critical");
    }
  }
}

// ─────────────────────────────────────
// /api/auth/* 테스트
// ─────────────────────────────────────
async function testAuthEndpoints(adminCookie) {
  console.log("\n━━━ [2] /api/auth/* 테스트 ━━━");

  // GET /api/auth/me - 비인증
  const noAuth = await apiCall("GET", "/api/auth/me");
  if (noAuth.status === 401) pass("GET /api/auth/me 비인증 → 401");
  else fail("GET /api/auth/me 비인증", "401", noAuth.status, "Critical");

  // GET /api/auth/me - admin
  const me = await apiCall("GET", "/api/auth/me", null, adminCookie);
  if (me.status === 200 && me.data?.role === "admin") {
    pass(`GET /api/auth/me (admin) → role=admin`);
  } else {
    fail("GET /api/auth/me (admin)", "200 + role=admin", `${me.status} + ${JSON.stringify(me.data)}`);
  }

  // POST /api/auth/register - 짧은 비밀번호
  const r1 = await apiCall("POST", "/api/auth/register", {
    name: "테스트", email: "inv@example.com", password: "short",
  });
  if (r1.status === 400) pass("POST /api/auth/register 짧은 비밀번호 → 400");
  else fail("POST /api/auth/register 짧은 비밀번호", "400", r1.status);

  // POST /api/auth/register - 숫자 없는 비밀번호
  const r2 = await apiCall("POST", "/api/auth/register", {
    name: "테스트", email: "inv2@example.com", password: "onlyletters",
  });
  if (r2.status === 400) pass("POST /api/auth/register 숫자 없는 비밀번호 → 400");
  else fail("POST /api/auth/register 숫자 없는 비밀번호", "400", r2.status);

  // POST /api/auth/register - 빈 이름
  const r3 = await apiCall("POST", "/api/auth/register", {
    name: "", email: "inv3@example.com", password: "valid1234",
  });
  if (r3.status === 400) pass("POST /api/auth/register 빈 이름 → 400");
  else fail("POST /api/auth/register 빈 이름", "400", r3.status);
}

// ─────────────────────────────────────
// /api/dashboard 테스트
// ─────────────────────────────────────
async function testDashboard(adminCookie, instructorCookie) {
  console.log("\n━━━ [3] /api/dashboard 테스트 ━━━");

  const admin = await apiCall("GET", "/api/dashboard", null, adminCookie);
  if (admin.status === 200 && typeof admin.data?.todayCount === "number") {
    pass("GET /api/dashboard (admin) → 200 + todayCount");
  } else {
    fail("GET /api/dashboard (admin)", "200 + {todayCount}", `${admin.status} + ${JSON.stringify(admin.data)}`);
  }
  if (admin.data?.isAdmin === true) pass("대시보드 isAdmin=true (admin)");
  else fail("대시보드 isAdmin=true", "true", admin.data?.isAdmin);

  if (instructorCookie) {
    const inst = await apiCall("GET", "/api/dashboard", null, instructorCookie);
    if (inst.status === 200 && inst.data?.isAdmin === false) {
      pass("GET /api/dashboard (instructor) → isAdmin=false");
    } else {
      fail("GET /api/dashboard (instructor)", "200 + isAdmin=false", `${inst.status} + isAdmin=${inst.data?.isAdmin}`);
    }
  }
}

// ─────────────────────────────────────
// /api/members 테스트
// ─────────────────────────────────────
async function testMembers(adminCookie, instructorCookie) {
  console.log("\n━━━ [4] /api/members 테스트 ━━━");
  let createdMemberId = null;

  // GET (admin)
  const list = await apiCall("GET", "/api/members", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/members (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/members (admin)", "200 + array", list.status);
  }

  // GET with search
  const search = await apiCall("GET", "/api/members?search=QA", null, adminCookie);
  if (search.status === 200 && Array.isArray(search.data)) {
    pass(`GET /api/members?search=QA → 200 + array[${search.data.length}]`);
  } else {
    fail("GET /api/members?search", "200 + array", search.status);
  }

  // POST (admin)
  const create = await apiCall("POST", "/api/members", {
    name: "QA 테스트 회원", phone: "010-9999-8888", memo: "QA 테스트용",
  }, adminCookie);
  if (create.status === 200 || create.status === 201) {
    createdMemberId = create.data?.id;
    pass(`POST /api/members (admin) → ${create.status} + id=${createdMemberId}`);
  } else {
    fail("POST /api/members (admin)", "200/201", `${create.status} + ${JSON.stringify(create.data)}`);
  }

  // POST - 빈 이름 (유효성 검사)
  const badCreate = await apiCall("POST", "/api/members", { name: "" }, adminCookie);
  if (badCreate.status === 400) pass("POST /api/members 빈 이름 → 400");
  else fail("POST /api/members 빈 이름", "400", badCreate.status);

  // GET [id] - 생성된 회원
  if (createdMemberId) {
    const detail = await apiCall("GET", `/api/members/${createdMemberId}`, null, adminCookie);
    if (detail.status === 200 && detail.data?.id === createdMemberId) {
      pass(`GET /api/members/${createdMemberId} → 200`);
    } else {
      fail(`GET /api/members/:id`, "200 + member", `${detail.status}`);
    }

    // PATCH
    const patch = await apiCall("PATCH", `/api/members/${createdMemberId}`, {
      memo: "QA 수정됨",
    }, adminCookie);
    if (patch.status === 200) pass(`PATCH /api/members/:id → 200`);
    else fail("PATCH /api/members/:id", "200", `${patch.status} + ${JSON.stringify(patch.data)}`);
  }

  // GET - 존재하지 않는 ID
  const notFound = await apiCall("GET", "/api/members/nonexistent-id", null, adminCookie);
  if (notFound.status === 404) pass("GET /api/members/nonexistent → 404");
  else fail("GET /api/members/nonexistent", "404", notFound.status, "Minor");

  // 강사가 POST 시도 → 403
  if (instructorCookie) {
    const r = await apiCall("POST", "/api/members", { name: "강사시도" }, instructorCookie);
    if (r.status === 403) pass("POST /api/members (instructor) → 403 권한 거부");
    else fail("POST /api/members (instructor)", "403", r.status, "Critical");
  }

  return createdMemberId;
}

// ─────────────────────────────────────
// /api/instructors 테스트
// ─────────────────────────────────────
async function testInstructors(adminCookie, instructorCookie) {
  console.log("\n━━━ [5] /api/instructors 테스트 ━━━");

  // GET (admin)
  const list = await apiCall("GET", "/api/instructors", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/instructors (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/instructors (admin)", "200 + array", list.status);
  }

  // GET (instructor)
  if (instructorCookie) {
    const instList = await apiCall("GET", "/api/instructors", null, instructorCookie);
    if (instList.status === 200) pass(`GET /api/instructors (instructor) → 200`);
    else fail("GET /api/instructors (instructor)", "200", instList.status);
  }

  // POST - 중복 이메일
  const dupCreate = await apiCall("POST", "/api/instructors", {
    email: INSTRUCTOR_CREDS.email,
    password: INSTRUCTOR_CREDS.password,
    name: "중복 강사",
  }, adminCookie);
  if (dupCreate.status === 409 || dupCreate.status === 400) {
    pass(`POST /api/instructors 중복 이메일 → ${dupCreate.status}`);
  } else {
    fail("POST /api/instructors 중복 이메일", "409/400", dupCreate.status, "Minor");
  }

  // 강사가 POST 시도 → 403
  if (instructorCookie) {
    const r = await apiCall("POST", "/api/instructors", {
      email: "another@example.com", password: "test1234", name: "강사시도",
    }, instructorCookie);
    if (r.status === 403) pass("POST /api/instructors (instructor) → 403");
    else fail("POST /api/instructors (instructor)", "403", r.status, "Critical");
  }

  // GET [id] - 존재하는 강사
  if (Array.isArray(list.data) && list.data.length > 0) {
    const firstId = list.data[0].id;
    const detail = await apiCall("GET", `/api/instructors/${firstId}`, null, adminCookie);
    if (detail.status === 200 && detail.data?.id === firstId) {
      pass(`GET /api/instructors/:id → 200`);
    } else {
      fail("GET /api/instructors/:id", "200", `${detail.status}`);
    }
  }
}

// ─────────────────────────────────────
// /api/programs 테스트
// ─────────────────────────────────────
async function testPrograms(adminCookie, instructorCookie) {
  console.log("\n━━━ [6] /api/programs 테스트 ━━━");
  let createdProgramId = null;

  // GET (admin)
  const list = await apiCall("GET", "/api/programs", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/programs (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/programs (admin)", "200 + array", list.status);
  }

  // GET with category filter
  const filtered = await apiCall("GET", "/api/programs?category=pilates", null, adminCookie);
  if (filtered.status === 200 && Array.isArray(filtered.data)) {
    pass(`GET /api/programs?category=pilates → array[${filtered.data.length}]`);
  } else {
    fail("GET /api/programs?category=pilates", "200 + array", filtered.status);
  }

  // POST (admin)
  const create = await apiCall("POST", "/api/programs", {
    name: "QA 테스트 프로그램",
    category: "pilates",
    duration: 50,
    capacity: 10,
    color: "#FF5733",
  }, adminCookie);
  if (create.status === 200 || create.status === 201) {
    createdProgramId = create.data?.id;
    pass(`POST /api/programs (admin) → ${create.status}`);
  } else {
    fail("POST /api/programs (admin)", "200/201", `${create.status} + ${JSON.stringify(create.data)}`);
  }

  // POST - 빈 이름 (유효성 검사)
  const badCreate = await apiCall("POST", "/api/programs", { name: "" }, adminCookie);
  if (badCreate.status === 400) pass("POST /api/programs 빈 이름 → 400");
  else fail("POST /api/programs 빈 이름", "400", badCreate.status);

  if (createdProgramId) {
    // PATCH
    const patch = await apiCall("PATCH", `/api/programs/${createdProgramId}`, {
      name: "QA 수정 프로그램",
    }, adminCookie);
    if (patch.status === 200) pass(`PATCH /api/programs/:id → 200`);
    else fail("PATCH /api/programs/:id", "200", patch.status);

    // DELETE (soft)
    const del = await apiCall("DELETE", `/api/programs/${createdProgramId}`, null, adminCookie);
    if (del.status === 200) pass(`DELETE /api/programs/:id → 200 (soft delete)`);
    else fail("DELETE /api/programs/:id", "200", del.status);
  }

  // 강사가 POST 시도 → 403
  if (instructorCookie) {
    const r = await apiCall("POST", "/api/programs", { name: "강사시도" }, instructorCookie);
    if (r.status === 403) pass("POST /api/programs (instructor) → 403");
    else fail("POST /api/programs (instructor)", "403", r.status, "Critical");
  }

  return createdProgramId;
}

// ─────────────────────────────────────
// /api/memberships 테스트
// ─────────────────────────────────────
async function testMemberships(adminCookie, instructorCookie, memberId) {
  console.log("\n━━━ [7] /api/memberships 테스트 ━━━");
  let createdMembershipId = null;

  // GET (admin)
  const list = await apiCall("GET", "/api/memberships", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/memberships (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/memberships (admin)", "200 + array", list.status);
  }

  // GET with status filter
  for (const status of ["active", "expired", "paused"]) {
    const r = await apiCall("GET", `/api/memberships?status=${status}`, null, adminCookie);
    if (r.status === 200 && Array.isArray(r.data)) {
      pass(`GET /api/memberships?status=${status} → 200`);
    } else {
      fail(`GET /api/memberships?status=${status}`, "200", r.status);
    }
  }

  // POST (admin) - count 타입
  if (memberId) {
    const today = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const create = await apiCall("POST", "/api/memberships", {
      memberId,
      type: "count",
      name: "QA 테스트 수강권",
      totalCount: 10,
      startDate: today,
      endDate,
      price: 100000,
    }, adminCookie);
    if (create.status === 200 || create.status === 201) {
      createdMembershipId = create.data?.id;
      pass(`POST /api/memberships (count) → ${create.status}`);
    } else {
      fail("POST /api/memberships (count)", "200/201", `${create.status} + ${JSON.stringify(create.data)}`);
    }

    // POST - period 타입
    const createPeriod = await apiCall("POST", "/api/memberships", {
      memberId,
      type: "period",
      name: "QA 기간 수강권",
      startDate: today,
      endDate,
      price: 150000,
    }, adminCookie);
    if (createPeriod.status === 200 || createPeriod.status === 201) {
      pass(`POST /api/memberships (period) → ${createPeriod.status}`);
    } else {
      fail("POST /api/memberships (period)", "200/201", `${createPeriod.status} + ${JSON.stringify(createPeriod.data)}`);
    }

    // POST - 잘못된 type
    const badType = await apiCall("POST", "/api/memberships", {
      memberId, type: "invalid", name: "잘못된", startDate: today, endDate, price: 0,
    }, adminCookie);
    if (badType.status === 400) pass("POST /api/memberships 잘못된 type → 400");
    else fail("POST /api/memberships 잘못된 type", "400", badType.status, "Minor");
  }

  // 강사가 POST 시도 → 403
  if (instructorCookie && memberId) {
    const today = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const r = await apiCall("POST", "/api/memberships", {
      memberId, type: "count", name: "강사시도", totalCount: 5,
      startDate: today, endDate, price: 50000,
    }, instructorCookie);
    if (r.status === 403) pass("POST /api/memberships (instructor) → 403");
    else fail("POST /api/memberships (instructor)", "403", r.status, "Critical");
  }

  return createdMembershipId;
}

// ─────────────────────────────────────
// /api/slots 테스트
// ─────────────────────────────────────
async function testSlots(adminCookie, instructorCookie) {
  console.log("\n━━━ [8] /api/slots 테스트 ━━━");

  // GET (admin)
  const list = await apiCall("GET", "/api/slots", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/slots (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/slots (admin)", "200 + array", list.status);
  }

  // 강사 자신의 슬롯 조회
  if (instructorCookie) {
    const r = await apiCall("GET", "/api/slots", null, instructorCookie);
    if (r.status === 200 && Array.isArray(r.data)) {
      pass(`GET /api/slots (instructor) → 200 + array[${r.data.length}]`);
    } else {
      fail("GET /api/slots (instructor)", "200 + array", r.status);
    }
  }
}

// ─────────────────────────────────────
// /api/bookings 테스트
// ─────────────────────────────────────
async function testBookings(adminCookie, instructorCookie, memberId, membershipId) {
  console.log("\n━━━ [9] /api/bookings 테스트 ━━━");
  let createdBookingId = null;

  // GET (admin)
  const list = await apiCall("GET", "/api/bookings", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/bookings (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/bookings (admin)", "200 + array", list.status);
  }

  // GET with date filter
  const today = new Date().toISOString().split("T")[0];
  const dateFiltered = await apiCall("GET", `/api/bookings?startDate=${today}&endDate=${today}`, null, adminCookie);
  if (dateFiltered.status === 200 && Array.isArray(dateFiltered.data)) {
    pass(`GET /api/bookings?startDate/endDate → 200 + array[${dateFiltered.data.length}]`);
  } else {
    fail("GET /api/bookings?startDate/endDate", "200 + array", dateFiltered.status);
  }

  // POST - 필수 필드 누락
  const badCreate = await apiCall("POST", "/api/bookings", { date: today }, adminCookie);
  if (badCreate.status === 400) pass("POST /api/bookings 필수 필드 누락 → 400");
  else fail("POST /api/bookings 필수 필드 누락", "400", badCreate.status);

  // POST - 실제 예약 (멤버십이 있는 경우)
  if (memberId && membershipId) {
    const instList = await apiCall("GET", "/api/instructors", null, adminCookie);
    const firstInstructor = Array.isArray(instList.data) ? instList.data[0] : null;
    if (firstInstructor) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const create = await apiCall("POST", "/api/bookings", {
        instructorId: firstInstructor.id,
        memberId,
        date: tomorrow,
        startTime: "10:00",
        price: 50000,
      }, adminCookie);
      if (create.status === 200 || create.status === 201) {
        createdBookingId = create.data?.id;
        pass(`POST /api/bookings → ${create.status} + id=${createdBookingId}`);
      } else {
        fail("POST /api/bookings", "200/201", `${create.status} + ${JSON.stringify(create.data)}`);
      }
    }
  }

  // 강사 예약 조회 (자기 것만)
  if (instructorCookie) {
    const r = await apiCall("GET", "/api/bookings", null, instructorCookie);
    if (r.status === 200 && Array.isArray(r.data)) {
      pass(`GET /api/bookings (instructor) → 200 + array[${r.data.length}]`);
    } else {
      fail("GET /api/bookings (instructor)", "200", r.status);
    }
  }

  // PATCH [id] - 존재하는 예약
  if (createdBookingId) {
    const patch = await apiCall("PATCH", `/api/bookings/${createdBookingId}`, {
      status: "completed",
    }, adminCookie);
    if (patch.status === 200) pass(`PATCH /api/bookings/:id → 200`);
    else fail("PATCH /api/bookings/:id", "200", `${patch.status} + ${JSON.stringify(patch.data)}`);
  }

  return createdBookingId;
}

// ─────────────────────────────────────
// /api/attendance 테스트
// ─────────────────────────────────────
async function testAttendance(adminCookie, bookingId) {
  console.log("\n━━━ [10] /api/attendance 테스트 ━━━");

  // GET (admin)
  const list = await apiCall("GET", "/api/attendance", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/attendance (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/attendance (admin)", "200 + array", list.status);
  }

  // POST - bookingId 없음
  const bad = await apiCall("POST", "/api/attendance", {}, adminCookie);
  if (bad.status === 400) pass("POST /api/attendance bookingId 없음 → 400");
  else fail("POST /api/attendance bookingId 없음", "400", bad.status);

  // POST - 출석 체크 (예약이 있는 경우)
  if (bookingId) {
    const create = await apiCall("POST", "/api/attendance", {
      bookingId, method: "manual",
    }, adminCookie);
    if (create.status === 200 || create.status === 201) {
      pass(`POST /api/attendance → ${create.status}`);

      // 중복 체크인
      const dup = await apiCall("POST", "/api/attendance", {
        bookingId, method: "manual",
      }, adminCookie);
      if (dup.status === 409 || dup.status === 400) {
        pass(`POST /api/attendance 중복 → ${dup.status}`);
      } else {
        fail("POST /api/attendance 중복 체크인", "409/400", dup.status, "Minor");
      }
    } else {
      fail("POST /api/attendance", "200/201", `${create.status} + ${JSON.stringify(create.data)}`);
    }
  }
}

// ─────────────────────────────────────
// /api/class-schedules 테스트
// ─────────────────────────────────────
async function testClassSchedules(adminCookie, instructorCookie) {
  console.log("\n━━━ [11] /api/class-schedules 테스트 ━━━");

  // GET (admin)
  const list = await apiCall("GET", "/api/class-schedules", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/class-schedules (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/class-schedules (admin)", "200 + array", list.status);
  }

  // GET with dayOfWeek
  const filtered = await apiCall("GET", "/api/class-schedules?dayOfWeek=1", null, adminCookie);
  if (filtered.status === 200 && Array.isArray(filtered.data)) {
    pass(`GET /api/class-schedules?dayOfWeek=1 → 200 + array[${filtered.data.length}]`);
  } else {
    fail("GET /api/class-schedules?dayOfWeek", "200 + array", filtered.status);
  }

  // 강사가 POST 시도 → 403
  if (instructorCookie) {
    const r = await apiCall("POST", "/api/class-schedules", {
      programId: "any", instructorId: "any", dayOfWeek: 1,
      startTime: "10:00", endTime: "11:00",
    }, instructorCookie);
    if (r.status === 403) pass("POST /api/class-schedules (instructor) → 403");
    else fail("POST /api/class-schedules (instructor)", "403", r.status, "Critical");
  }
}

// ─────────────────────────────────────
// /api/notifications 테스트
// ─────────────────────────────────────
async function testNotifications(adminCookie) {
  console.log("\n━━━ [12] /api/notifications 테스트 ━━━");

  // GET (admin)
  const list = await apiCall("GET", "/api/notifications", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/notifications (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/notifications (admin)", "200 + array", list.status);
  }

  // PATCH read-all
  const readAll = await apiCall("PATCH", "/api/notifications/read-all", null, adminCookie);
  if (readAll.status === 200) pass("PATCH /api/notifications/read-all → 200");
  else fail("PATCH /api/notifications/read-all", "200", readAll.status);

  // PATCH - 존재하지 않는 ID → 404
  const badPatch = await apiCall("PATCH", "/api/notifications/nonexistent-id-99999", null, adminCookie);
  if (badPatch.status === 404) pass("PATCH /api/notifications/nonexistent → 404");
  else fail("PATCH /api/notifications/nonexistent", "404", badPatch.status, "Minor");
}

// ─────────────────────────────────────
// /api/settlements 테스트
// ─────────────────────────────────────
async function testSettlements(adminCookie, instructorCookie) {
  console.log("\n━━━ [13] /api/settlements 테스트 ━━━");

  // GET (admin)
  const list = await apiCall("GET", "/api/settlements?year=2026&month=4", null, adminCookie);
  if (list.status === 200 && Array.isArray(list.data)) {
    pass(`GET /api/settlements (admin) → 200 + array[${list.data.length}]`);
  } else {
    fail("GET /api/settlements (admin)", "200 + array", list.status);
  }

  // 강사가 전체 정산 조회 → 403
  if (instructorCookie) {
    const r = await apiCall("GET", "/api/settlements", null, instructorCookie);
    if (r.status === 403) pass("GET /api/settlements (instructor) → 403");
    else fail("GET /api/settlements (instructor)", "403", r.status, "Critical");
  }
}

// ─────────────────────────────────────
// /api/analytics 테스트
// ─────────────────────────────────────
async function testAnalytics(adminCookie, instructorCookie) {
  console.log("\n━━━ [14] /api/analytics 테스트 ━━━");

  const expectedMonthly = { month: 4, quarter: 3, year: 12 };

  for (const period of ["month", "quarter", "year"]) {
    const r = await apiCall("GET", `/api/analytics?period=${period}`, null, adminCookie);
    if (r.status === 200 && r.data?.revenue && r.data?.members) {
      const monthlyLen = r.data.revenue.monthly?.length;
      const expectedLen = expectedMonthly[period];
      if (monthlyLen === expectedLen) {
        pass(`GET /api/analytics?period=${period} → 200 + monthly[${monthlyLen}]`);
      } else {
        fail(`GET /api/analytics?period=${period} monthly 개수`, `${expectedLen}개`, `${monthlyLen}개`, "Minor");
      }

      // instructors 배열 구조 확인
      if (Array.isArray(r.data.instructors)) {
        pass(`GET /api/analytics?period=${period} instructors 배열 확인`);
      } else {
        fail(`GET /api/analytics?period=${period} instructors`, "array", typeof r.data.instructors);
      }
    } else {
      fail(`GET /api/analytics?period=${period}`, "200 + {revenue,members}", `${r.status} + ${JSON.stringify(r.data)?.slice(0, 100)}`);
    }
  }

  // 강사가 analytics 조회 → 403
  if (instructorCookie) {
    const r = await apiCall("GET", "/api/analytics?period=month", null, instructorCookie);
    if (r.status === 403) pass("GET /api/analytics (instructor) → 403");
    else fail("GET /api/analytics (instructor)", "403", r.status, "Critical");
  }
}

// ─────────────────────────────────────
// /api/settings/password 테스트
// ─────────────────────────────────────
async function testSettings(adminCookie) {
  console.log("\n━━━ [15] /api/settings/password 테스트 ━━━");

  // 짧은 비밀번호 → 400
  const r1 = await apiCall("PATCH", "/api/settings/password", {
    currentPassword: ADMIN_CREDS.password,
    newPassword: "short",
  }, adminCookie);
  if (r1.status === 400) pass("PATCH /api/settings/password 짧은 비밀번호 → 400");
  else fail("PATCH /api/settings/password 짧은 비밀번호", "400", r1.status);

  // 숫자 없는 비밀번호 → 400
  const r2 = await apiCall("PATCH", "/api/settings/password", {
    currentPassword: ADMIN_CREDS.password,
    newPassword: "onlyletters",
  }, adminCookie);
  if (r2.status === 400) pass("PATCH /api/settings/password 숫자 없는 비밀번호 → 400");
  else fail("PATCH /api/settings/password 숫자 없는 비밀번호", "400", r2.status);

  // 잘못된 현재 비밀번호 → 400/401
  const r3 = await apiCall("PATCH", "/api/settings/password", {
    currentPassword: "wrongpassword1",
    newPassword: "newvalid1234",
  }, adminCookie);
  if (r3.status === 400 || r3.status === 401) {
    pass(`PATCH /api/settings/password 잘못된 현재 비밀번호 → ${r3.status}`);
  } else {
    fail("PATCH /api/settings/password 잘못된 현재 비밀번호", "400/401", r3.status, "Critical");
  }
}

// ─────────────────────────────────────
// /api/member/bookings 테스트
// ─────────────────────────────────────
async function testMemberBookings(adminCookie, memberId) {
  console.log("\n━━━ [16] /api/member/bookings 테스트 ━━━");

  if (!memberId) {
    console.log("  ℹ 회원 ID 없음 - 스킵");
    return;
  }

  const r = await apiCall("GET", `/api/member/bookings?memberId=${memberId}`, null, adminCookie);
  if (r.status === 200 && Array.isArray(r.data)) {
    pass(`GET /api/member/bookings?memberId → 200 + array[${r.data.length}]`);
  } else {
    fail("GET /api/member/bookings?memberId", "200 + array", `${r.status} + ${JSON.stringify(r.data)}`);
  }

  // type=memberships
  const ms = await apiCall("GET", `/api/member/bookings?memberId=${memberId}&type=memberships`, null, adminCookie);
  if (ms.status === 200 && Array.isArray(ms.data)) {
    pass(`GET /api/member/bookings?type=memberships → 200 + array[${ms.data.length}]`);
  } else {
    fail("GET /api/member/bookings?type=memberships", "200 + array", `${ms.status}`);
  }

  // memberId 없음 → 400
  const bad = await apiCall("GET", "/api/member/bookings", null, adminCookie);
  if (bad.status === 400) pass("GET /api/member/bookings memberId 없음 → 400");
  else fail("GET /api/member/bookings memberId 없음", "400", bad.status);
}

// ─────────────────────────────────────
// 역할 기반 권한 요약 테스트
// ─────────────────────────────────────
async function testRoleBasedAccess(adminCookie, instructorCookie) {
  console.log("\n━━━ [17] 역할 기반 권한 요약 테스트 ━━━");

  const adminOnlyEndpoints = [
    { method: "POST", path: "/api/members", body: { name: "X" } },
    { method: "POST", path: "/api/programs", body: { name: "X" } },
    { method: "POST", path: "/api/class-schedules", body: {} },
    { method: "GET", path: "/api/settlements" },
    { method: "GET", path: "/api/analytics?period=month" },
  ];

  if (!instructorCookie) {
    console.log("  ℹ 강사 세션 없음 - 역할 권한 테스트 스킵");
    return;
  }

  for (const ep of adminOnlyEndpoints) {
    const r = await apiCall(ep.method, ep.path, ep.body, instructorCookie);
    if (r.status === 403) {
      pass(`${ep.method} ${ep.path} (instructor → admin-only) → 403`);
    } else {
      fail(`${ep.method} ${ep.path} (instructor → admin-only)`, "403", r.status, "Critical");
    }
  }
}

// ─────────────────────────────────────
// 정리
// ─────────────────────────────────────
async function cleanup(adminCookie, memberId, bookingId) {
  if (!adminCookie || !memberId) return;
  if (bookingId) await apiCall("DELETE", `/api/bookings/${bookingId}`, null, adminCookie);
  await apiCall("DELETE", `/api/members/${memberId}`, null, adminCookie);
  console.log("\n  ℹ 테스트 데이터 정리 완료");
}

// ─────────────────────────────────────
// 메인
// ─────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║   CenterOn QA API 통합 테스트 v2      ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`시작: ${new Date().toLocaleString("ko-KR")}`);

  // 인증
  console.log("\n━━━ 인증 ━━━");
  const adminCookie = await getSessionCookie(ADMIN_CREDS.email, ADMIN_CREDS.password);
  if (!adminCookie) {
    console.log("⚠️  관리자 인증 실패 - 중단");
    process.exit(1);
  }
  console.log("  ✓ 관리자 로그인 성공");

  let instructorCookie = null;
  try {
    instructorCookie = await getSessionCookie(INSTRUCTOR_CREDS.email, INSTRUCTOR_CREDS.password);
    if (instructorCookie) console.log("  ✓ 강사 로그인 성공");
    else console.log("  ✗ 강사 로그인 실패 (강사 전용 테스트 스킵)");
  } catch (e) {
    console.log("  ✗ 강사 로그인 오류:", e.message);
  }

  // 테스트 실행
  await testUnauthenticated();
  await testAuthEndpoints(adminCookie);
  await testDashboard(adminCookie, instructorCookie);
  const memberId = await testMembers(adminCookie, instructorCookie);
  await testInstructors(adminCookie, instructorCookie);
  await testPrograms(adminCookie, instructorCookie);
  const membershipId = await testMemberships(adminCookie, instructorCookie, memberId);
  await testSlots(adminCookie, instructorCookie);
  const bookingId = await testBookings(adminCookie, instructorCookie, memberId, membershipId);
  await testAttendance(adminCookie, bookingId);
  await testClassSchedules(adminCookie, instructorCookie);
  await testNotifications(adminCookie);
  await testSettlements(adminCookie, instructorCookie);
  await testAnalytics(adminCookie, instructorCookie);
  await testSettings(adminCookie);
  await testMemberBookings(adminCookie, memberId);
  await testRoleBasedAccess(adminCookie, instructorCookie);

  // 정리
  await cleanup(adminCookie, memberId, bookingId);

  // 결과
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║         테스트 결과 요약               ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`✓ PASS: ${results.pass}`);
  console.log(`✗ FAIL: ${results.fail}`);
  console.log(`합계: ${results.pass + results.fail}개`);
  console.log(`합격률: ${Math.round(results.pass / (results.pass + results.fail) * 100)}%`);

  if (results.issues.length > 0) {
    console.log("\n━━━ 발견된 버그 ━━━");
    results.issues.forEach((issue, i) => {
      console.log(`\n[FAIL #${i + 1}] ${issue.label}`);
      console.log(`  기대: ${issue.expected}`);
      console.log(`  실제: ${issue.actual}`);
      console.log(`  심각도: ${issue.severity}`);
    });
  }

  // JSON 결과 저장
  const fs = await import("fs");
  fs.writeFileSync("/tmp/qa-results.json", JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { pass: results.pass, fail: results.fail },
    issues: results.issues,
  }, null, 2));
  console.log("\n결과 저장: /tmp/qa-results.json");
}

main().catch(console.error);
