import { z } from "zod";

// Member validation
export const createMemberSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이내로 입력해주세요"),
  phone: z.string().optional(),
  instructorId: z.string().uuid().optional().nullable(),
  memo: z.string().max(500, "메모는 500자 이내로 입력해주세요").optional(),
});

// Booking validation
export const createBookingSchema = z.object({
  instructorId: z.string().uuid("유효하지 않은 강사 ID입니다"),
  memberId: z.string().uuid("유효하지 않은 회원 ID입니다"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다 (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다 (HH:mm)").optional(),
  price: z.number().min(0, "수강료는 0 이상이어야 합니다"),
});

// Membership validation
export const createMembershipSchema = z.object({
  memberId: z.string().uuid("유효하지 않은 회원 ID입니다"),
  type: z.enum(["count", "period"], { message: "유형은 회차제 또는 기간제만 가능합니다" }),
  name: z.string().min(1, "수강권 이름을 입력해주세요").max(100),
  totalCount: z.number().int().positive("횟수는 1 이상이어야 합니다").optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().min(0, "금액은 0 이상이어야 합니다"),
});

// Program validation
export const createProgramSchema = z.object({
  name: z.string().min(1, "프로그램 이름을 입력해주세요").max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["pilates", "yoga", "pt", "group"]),
  duration: z.number().int().min(10, "최소 10분").max(180, "최대 180분"),
  capacity: z.number().int().min(1, "최소 1명").max(50, "최대 50명"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  instructorId: z.string().uuid().optional().nullable(),
});

// Registration validation
export const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .regex(/[A-Za-z]/, "영문을 포함해야 합니다")
    .regex(/[0-9]/, "숫자를 포함해야 합니다"),
  centerName: z.string().optional(),
  phone: z.string().optional(),
});

// Password change validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z.string()
    .min(8, "새 비밀번호는 8자 이상이어야 합니다")
    .regex(/[A-Za-z]/, "영문을 포함해야 합니다")
    .regex(/[0-9]/, "숫자를 포함해야 합니다"),
});

// Helper to validate and return parsed data or error response
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { success: false, error: firstIssue.message };
  }
  return { success: true, data: result.data };
}
