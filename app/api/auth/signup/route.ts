import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
} from "@/lib/auth/session";

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { username, password, displayName } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if username exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Create user
    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id: userId,
      username: username.toLowerCase().trim(),
      passwordHash,
      displayName: displayName || username,
      createdAt: new Date(),
    });

    // Create session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, userId);
    await setSessionTokenCookie(sessionToken, session.expiresAt);

    return NextResponse.json({ success: true, redirect: "/onboarding" });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
