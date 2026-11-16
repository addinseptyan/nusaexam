import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COOKIE_NAME, hashToken, isSameOrigin, verifyPassword } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  let data: unknown;
  try { data = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const body = data as Record<string, unknown> | null;
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 50 || body.password.length > 256) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  const user = await db.adminUser.findUnique({ where: { username: body.username.trim().toLowerCase() } });
  if (!user || !verifyPassword(body.password, user.passwordHash)) return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db.session.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE === "true", path: "/", expires: expiresAt });
  return response;
}
