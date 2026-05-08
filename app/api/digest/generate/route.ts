import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateDigestsForUser } from "@/lib/ai/pipeline";

export async function POST(request: NextRequest) {
  // Validate cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const allUsers = await db.select().from(users);

    let processed = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        await generateDigestsForUser(user.id);
        processed++;
      } catch (error) {
        console.error(`Failed to generate digests for user ${user.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      total: allUsers.length,
    });
  } catch (error) {
    console.error("Cron digest generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate digests" },
      { status: 500 }
    );
  }
}
