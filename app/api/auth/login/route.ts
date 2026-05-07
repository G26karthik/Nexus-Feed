import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, interestNodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  generateSessionToken,
  createSession,
  setSessionTokenCookie,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = result[0];

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    await setSessionTokenCookie(sessionToken, session.expiresAt);

    // Check if user has interests (for redirect)
    const interests = await db
      .select()
      .from(interestNodes)
      .where(eq(interestNodes.userId, user.id))
      .limit(1);

    const redirect = interests.length > 0 ? "/dashboard" : "/onboarding";

    return NextResponse.json({ success: true, redirect });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
