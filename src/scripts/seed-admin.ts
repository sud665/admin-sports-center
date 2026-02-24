import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../lib/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const passwordHash = await bcrypt.hash("admin1234", 10);

  await db.insert(users).values({
    email: "admin@studio.com",
    passwordHash,
    name: "센터장",
    role: "admin",
    isActive: true,
  });

  console.log("관리자 계정 생성 완료: admin@studio.com / admin1234");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
