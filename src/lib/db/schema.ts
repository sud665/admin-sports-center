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
