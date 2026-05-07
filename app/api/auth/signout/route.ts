import { getCurrentSession, invalidateSession, deleteSessionTokenCookie } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST() {
  const { session } = await getCurrentSession();
  if (session) {
    await invalidateSession(session.id);
  }
  await deleteSessionTokenCookie();
  return NextResponse.json({ success: true });
}
