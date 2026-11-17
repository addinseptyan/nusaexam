import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentStudent, isSameOrigin, STUDENT_COOKIE_NAME } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  const st = await getCurrentStudent();
  if (st) await db.studentSession.delete({ where: { id: st.sessionId } }).catch(() => null);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDENT_COOKIE_NAME, "", { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE === "true", path: "/", expires: new Date(0) });
  return response;
}
