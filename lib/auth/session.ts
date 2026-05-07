import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

// ─── Token Generation ───────────────────────────────
export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

// ─── Password Hashing (SHA-256 with salt) ───────────
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, "0")).join("");
  const data = new TextEncoder().encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === hash;
}

// ─── Session CRUD ───────────────────────────────────
export async function createSession(
  token: string,
  userId: string
): Promise<Session> {
  const sessionId = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  const session: Session = { id: sessionId, userId, expiresAt };

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return session;
}

export async function validateSessionToken(
  token: string
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );

  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    return { session: null, user: null };
  }

  const { session, user } = result[0];

  // Check if session has expired
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return { session: null, user: null };
  }

  // Extend session if it expires in less than 15 days
  if (
    Date.now() >=
    session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15
  ) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db
      .update(sessions)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessions.id, sessionId));
  }

  return {
    session,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// ─── Cookie Management ──────────────────────────────
export async function setSessionTokenCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSessionTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

// ─── Get Current Session (cached per request) ───────
export const getCurrentSession = cache(
  async (): Promise<SessionValidationResult> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value ?? null;
    if (token === null) {
      return { session: null, user: null };
    }
    return validateSessionToken(token);
  }
);

// ─── Types ──────────────────────────────────────────
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  createdAt: Date;
}

export interface SessionValidationResult {
  session: Session | null;
  user: User | null;
}
