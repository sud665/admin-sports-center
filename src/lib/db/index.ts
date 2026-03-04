import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  if (process.env.NEXT_PUBLIC_MOCK === "true") {
    return null as unknown as ReturnType<typeof drizzle<typeof schema>>;
  }
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export const db = createDb();
