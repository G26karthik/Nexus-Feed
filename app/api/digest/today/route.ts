import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { digests, digestItems, interestNodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateDigestForNode } from "@/lib/ai/pipeline";

export async function GET() {
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

  const digestsResult = [];

  for (const node of leaves) {
    // Check if digest exists for today
    let nodeDigest = await db
      .select()
      .from(digests)
      .where(and(eq(digests.nodeId, node.id), eq(digests.date, today)))
      .limit(1);

    // On-demand generation if missing
    if (nodeDigest.length === 0) {
      await generateDigestForNode(user.id, node.id, node.breadcrumb);
      nodeDigest = await db
        .select()
        .from(digests)
        .where(and(eq(digests.nodeId, node.id), eq(digests.date, today)))
        .limit(1);
    }

    let items: {
      id: string;
      digestId: string;
      title: string;
      summary: string;
      sourceUrl: string;
      sourceName: string | null;
      relevanceScore: number | null;
      position: number;
    }[] = [];
    if (nodeDigest.length > 0) {
      items = await db
        .select()
        .from(digestItems)
        .where(eq(digestItems.digestId, nodeDigest[0].id));
    }

    digestsResult.push({
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
      generatedAt: nodeDigest[0]?.createdAt || null,
    });
  }

  return NextResponse.json({ date: today, digests: digestsResult });
}
