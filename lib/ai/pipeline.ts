import { getDb } from "@/lib/db";
import { digests, digestItems, interestNodes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateSearchQueries, summarizeDigest, generateDigestWithoutSearch } from "./openai";
import { searchTopicMultiQuery, formatSearchResultsForLLM } from "./tavily";

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

const hasTavily = () => !!process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== "dummy";

export async function generateDigestForNode(
  userId: string,
  nodeId: string,
  breadcrumb: string
): Promise<void> {
  const today = getToday();
  const db = getDb();

  // Check if digest already exists (idempotent)
  const existing = await db
    .select()
    .from(digests)
    .where(
      and(
        eq(digests.nodeId, nodeId),
        eq(digests.date, today)
      )
    )
    .limit(1);

  if (existing.length > 0) return;

  try {
    let items;

    if (hasTavily()) {
      // Full pipeline: GPT queries → Tavily search → GPT summarize
      const queries = await generateSearchQueries(breadcrumb);
      const searchResults = await searchTopicMultiQuery(queries);

      if (searchResults.length === 0) {
        // Tavily returned nothing, fall back to GPT-only
        items = await generateDigestWithoutSearch(breadcrumb);
      } else {
        const formatted = formatSearchResultsForLLM(searchResults);
        items = await summarizeDigest(breadcrumb, formatted);
        // Retry once on failure
        if (items.length === 0) {
          items = await summarizeDigest(breadcrumb, formatted);
        }
      }
    } else {
      // No Tavily: GPT generates digest from its own knowledge
      items = await generateDigestWithoutSearch(breadcrumb);
    }

    // Filter (relevanceScore >= 60) and sort
    items = items
      .filter((item) => (item.relevanceScore || 0) >= 60)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);

    // Store digest + items
    const digestId = generateId();
    await db.insert(digests).values({
      id: digestId,
      userId,
      nodeId,
      date: today,
      createdAt: new Date(),
    });

    if (items.length > 0) {
      await db.insert(digestItems).values(
        items.map((item, index) => ({
          id: generateId(),
          digestId,
          title: item.title,
          summary: item.summary,
          sourceUrl: item.sourceUrl || "#",
          sourceName: item.sourceName || null,
          relevanceScore: item.relevanceScore || 0,
          position: index + 1,
        }))
      );
    }
  } catch (error) {
    console.error(`Digest generation failed for node ${nodeId}:`, error);
    // Store empty digest on failure
    await db.insert(digests).values({
      id: generateId(),
      userId,
      nodeId,
      date: getToday(),
      createdAt: new Date(),
    });
  }
}

export async function generateDigestsForUser(userId: string): Promise<void> {
  const db = getDb();
  const leaves = await db
    .select()
    .from(interestNodes)
    .where(
      and(eq(interestNodes.userId, userId), eq(interestNodes.isLeaf, true))
    );

  await Promise.allSettled(
    leaves.map((node) => generateDigestForNode(userId, node.id, node.breadcrumb))
  );
}
