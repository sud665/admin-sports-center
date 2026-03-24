import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  decimal,
  integer,
  date,
  time,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "instructor"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "booked",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull().default("instructor"),
  color: varchar("color", { length: 7 }),
  rate: decimal("rate", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  authId: uuid("auth_id").unique(), // Supabase auth user ID, nullable for existing members
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  instructorId: uuid("instructor_id").references(() => users.id),
  memo: text("memo"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: uuid("instructor_id")
    .references(() => users.id)
    .notNull(),
  memberId: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  programId: uuid("program_id").references(() => programs.id), // nullable, for group bookings
  price: integer("price").notNull(),
  status: bookingStatusEnum("status").notNull().default("booked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const availableSlots = pgTable("available_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: uuid("instructor_id")
    .references(() => users.id)
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Memberships ──────────────────────────────────────────────

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "expired",
  "paused",
]);
export const membershipTypeEnum = pgEnum("membership_type", [
  "count",
  "period",
]);

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id),
  type: membershipTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  totalCount: integer("total_count"),
  remainingCount: integer("remaining_count"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  price: integer("price").notNull().default(0),
  status: membershipStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Programs ─────────────────────────────────────────────────

export const programCategoryEnum = pgEnum("program_category", [
  "pilates",
  "yoga",
  "pt",
  "group",
]);

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: programCategoryEnum("category").notNull(),
  duration: integer("duration").notNull().default(50),
  capacity: integer("capacity").notNull().default(1),
  color: varchar("color", { length: 7 }).default("#3772FF"),
  instructorId: uuid("instructor_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Attendances ──────────────────────────────────────────────

export const attendanceMethodEnum = pgEnum("attendance_method", [
  "manual",
  "qr",
]);

export const attendances = pgTable("attendances", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id),
  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => users.id),
  checkInTime: varchar("check_in_time", { length: 5 }).notNull(),
  method: attendanceMethodEnum("method").notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Notifications ────────────────────────────────────────────

export const notificationTypeEnum = pgEnum("notification_type", [
  "booking",
  "membership_expiry",
  "attendance",
  "cancel",
  "new_member",
  "settlement",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Class Schedules ─────────────────────────────────────────

export const classSchedules = pgTable("class_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull().references(() => programs.id),
  instructorId: uuid("instructor_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday...
  startTime: varchar("start_time", { length: 5 }).notNull(), // "HH:mm"
  endTime: varchar("end_time", { length: 5 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
