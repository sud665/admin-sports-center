import { isMockMode } from "@/lib/mock-data";

/**
 * Check and expire outdated memberships.
 * Call this periodically or on relevant API calls.
 */
export async function expireMemberships() {
  if (isMockMode()) return;

  try {
    const { db } = await import("@/lib/db");
    const { memberships } = await import("@/lib/db/schema");
    const { eq, lt, and } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    // Expire memberships past their end date
    await db
      .update(memberships)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(memberships.status, "active"),
          lt(memberships.endDate, today)
        )
      );
  } catch (error) {
    console.error("Membership expiry check failed:", error);
  }
}
