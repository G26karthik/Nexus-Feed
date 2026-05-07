import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { interestNodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// GET /api/interests — returns user's saved interests
export async function GET() {
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const interests = await db
    .select()
    .from(interestNodes)
    .where(eq(interestNodes.userId, user.id));

  return NextResponse.json({
    interests: interests.map((i) => ({
      id: i.id,
      label: i.label,
      breadcrumb: i.breadcrumb,
      depth: i.depth,
    })),
  });
}

// POST /api/interests — save user's selected leaf nodes
export async function POST(request: NextRequest) {
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { selections } = body;

    if (!Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json(
        { error: "selections array is required" },
        { status: 400 }
      );
    }

    if (selections.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 interests allowed" },
        { status: 400 }
      );
    }

    // Delete existing interests
    await db
      .delete(interestNodes)
      .where(eq(interestNodes.userId, user.id));

    // Insert new ones
    await db.insert(interestNodes).values(
      selections.map(
        (s: { label: string; breadcrumb: string; depth: number }) => ({
          id: generateId(),
          userId: user.id,
          label: s.label,
          breadcrumb: s.breadcrumb,
          depth: s.depth || 1,
          isLeaf: true,
          createdAt: new Date(),
        })
      )
    );

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Save interests error:", error);
    return NextResponse.json(
      { error: "Failed to save interests" },
      { status: 500 }
    );
  }
}
