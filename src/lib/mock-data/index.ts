import usersData from "./users.json";
import membersData from "./members.json";
import bookingsTemplate from "./bookings.json";
import slotsData from "./slots.json";
import membershipsData from "./memberships.json";
import attendancesData from "./attendances.json";
import programsData from "./programs.json";
import notificationsData from "./notifications.json";

// --- 유틸 ---
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return formatDate(new Date());
}

function offsetDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return formatDate(d);
}

// --- Mock 사용자 ---
export const mockUsers = usersData;

// --- Mock 회원 (강사 정보 join) ---
export function getMockMembers() {
  return membersData.map((m) => {
    const instructor = mockUsers.find((u) => u.id === m.instructorId);
    return {
      ...m,
      instructorName: instructor?.name ?? null,
      instructorColor: instructor?.color ?? null,
    };
  });
}

// --- Mock 예약 (동적 날짜 + join) ---
export function getMockBookings() {
  return bookingsTemplate.map((b) => {
    const instructor = mockUsers.find((u) => u.id === b.instructorId);
    const member = membersData.find((m) => m.id === b.memberId);
    return {
      id: b.id,
      instructorId: b.instructorId,
      instructorName: instructor?.name ?? null,
      instructorColor: instructor?.color ?? null,
      memberId: b.memberId,
      memberName: member?.name ?? null,
      date: offsetDate(b.dayOffset),
      startTime: b.startTime,
      endTime: b.endTime,
      price: b.price,
      status: b.status,
      createdAt: new Date().toISOString(),
    };
  });
}

// --- Mock 슬롯 ---
export const mockSlots = slotsData;

// --- Mock 강사 목록 ---
export function getMockInstructors() {
  return mockUsers
    .filter((u) => u.role === "instructor")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ passwordHash: _pw, ...rest }) => rest);
}

// --- Mock 대시보드 ---
export function getMockDashboard(userId: string, role: string) {
  const today = getToday();
  const allBookings = getMockBookings();
  const todayBookings = allBookings.filter(
    (b) => b.date === today && b.status !== "cancelled"
  );

  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = formatDate(monday);
  const sundayStr = formatDate(sunday);

  const weekBookings = allBookings.filter(
    (b) => b.date >= mondayStr && b.date <= sundayStr && b.status !== "cancelled"
  );

  const filtered = role === "admin" ? todayBookings : todayBookings.filter((b) => b.instructorId === userId);
  const weekFiltered = role === "admin" ? weekBookings : weekBookings.filter((b) => b.instructorId === userId);

  return {
    todayCount: filtered.length,
    weekCount: weekFiltered.length,
    instructorCount: role === "admin" ? getMockInstructors().length : 0,
    memberCount: role === "admin" ? getMockMembers().length : 0,
    todayBookings: filtered
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        instructorName: b.instructorName,
        instructorColor: b.instructorColor,
        memberName: b.memberName,
        status: b.status,
      })),
    isAdmin: role === "admin",
  };
}

// --- Mock 정산 ---
export function getMockSettlements(year: number, month: number) {
  const allBookings = getMockBookings();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const completed = allBookings.filter(
    (b) => b.date >= startDate && b.date <= endDate && b.status === "completed"
  );

  const instructors = getMockInstructors();
  return instructors.map((inst) => {
    const lessons = completed.filter((b) => b.instructorId === inst.id);
    const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0);
    const rate = inst.rate ? parseFloat(inst.rate) : 0;
    return {
      instructorId: inst.id,
      instructorName: inst.name,
      instructorColor: inst.color,
      rate: inst.rate,
      lessonCount: lessons.length,
      totalRevenue,
      pay: Math.round((totalRevenue * rate) / 100),
    };
  });
}

export function getMockSettlementDetail(instructorId: string, year: number, month: number) {
  const instructor = mockUsers.find((u) => u.id === instructorId);
  if (!instructor) return null;

  const allBookings = getMockBookings();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const lessons = allBookings
    .filter(
      (b) =>
        b.instructorId === instructorId &&
        b.date >= startDate &&
        b.date <= endDate &&
        b.status === "completed"
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((b) => ({
      id: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      memberName: b.memberName,
      price: b.price,
      status: b.status,
    }));

  const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0);
  const rate = instructor.rate ? parseFloat(instructor.rate) : 0;

  return {
    instructor: {
      id: instructor.id,
      name: instructor.name,
      color: instructor.color,
      rate: instructor.rate,
    },
    lessons,
    summary: {
      lessonCount: lessons.length,
      totalRevenue,
      rate,
      pay: Math.round((totalRevenue * rate) / 100),
    },
  };
}

// --- Mock 수강권 (회원 이름 join) ---
export function getMockMemberships() {
  return membershipsData.map((ms) => {
    const member = membersData.find((m) => m.id === ms.memberId);
    return {
      ...ms,
      memberName: member?.name ?? "알 수 없음",
    };
  });
}

// --- Mock 출석 ---
export function getMockAttendances() {
  return attendancesData;
}

export function getMockTodayAttendance() {
  const today = getToday();
  const allBookings = getMockBookings();
  const todayBookings = allBookings.filter((b) => b.date === today);
  const attendances = getMockAttendances();

  return todayBookings.map((b) => {
    const att = attendances.find((a) => a.bookingId === b.id);
    return {
      bookingId: b.id,
      memberId: b.memberId,
      memberName: b.memberName ?? "알 수 없음",
      instructorName: b.instructorName ?? "알 수 없음",
      instructorColor: b.instructorColor ?? "#ccc",
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status as "booked" | "completed" | "cancelled",
      isCheckedIn: !!att,
      checkInTime: att?.checkInTime ?? null,
    };
  });
}

// --- Mock 프로그램 (강사 이름 join) ---
export function getMockPrograms() {
  return programsData.map((p) => {
    const instructor = mockUsers.find((u) => u.id === p.instructorId);
    return {
      ...p,
      instructorName: instructor?.name ?? null,
    };
  });
}

// --- Mock 알림 ---
export function getMockNotifications(userId: string) {
  return notificationsData
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- 데모 모드 헬퍼 ---
export const MOCK_DEMO_RESPONSE = Response.json(
  { error: "데모 모드에서는 지원되지 않는 기능입니다" },
  { status: 403 }
);

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK === "true";
}
