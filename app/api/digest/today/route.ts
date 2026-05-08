import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { digests, digestItems, interestNodes } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generateDigestForNode } from "@/lib/ai/pipeline";

export async function GET() {
  const db = getDb();
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Get user's leaf interests
  const leaves = await db
    .select()
    .from(interestNodes)
    .where(
      and(eq(interestNodes.userId, user.id), eq(interestNodes.isLeaf, true))
    );

  // Fetch all existing digests for the user today
  let existingDigests = await db
    .select()
    .from(digests)
    .where(and(eq(digests.userId, user.id), eq(digests.date, today)));

  // Identify nodes that need digest generation
  const missingNodes = leaves.filter(
    (node) => !existingDigests.find((d) => d.nodeId === node.id)
  );

  // Parallel generation of missing digests
  if (missingNodes.length > 0) {
    await Promise.allSettled(
      missingNodes.map((node) =>
        generateDigestForNode(user.id, node.id, node.breadcrumb)
      )
    );

    // Re-fetch all digests after generation
    existingDigests = await db
      .select()
      .from(digests)
      .where(and(eq(digests.userId, user.id), eq(digests.date, today)));
  }

  // Fetch all digest items in one query to avoid N+1
  let allItems: typeof digestItems.$inferSelect[] = [];
  if (existingDigests.length > 0) {
    const digestIds = existingDigests.map((d) => d.id);
    allItems = await db
      .select()
      .from(digestItems)
      .where(inArray(digestItems.digestId, digestIds));
  }

  const digestsResult = leaves.map((node) => {
    const nodeDigest = existingDigests.find((d) => d.nodeId === node.id);
    const items = nodeDigest
      ? allItems.filter((item) => item.digestId === nodeDigest.id)
      : [];

    return {
      nodeId: node.id,
      label: node.label,
      breadcrumb: node.breadcrumb,
      items: items
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          title: item.title,
          summary: item.summary,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          position: item.position,
        })),
      generatedAt: nodeDigest?.createdAt || null,
    };
  });

  return NextResponse.json({ date: today, digests: digestsResult });
}
