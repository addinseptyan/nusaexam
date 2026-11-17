import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken, isSameOrigin, STUDENT_COOKIE_NAME, verifyPassword } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  let data: unknown;
  try { data = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const body = data as Record<string, unknown> | null;
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 50 || body.password.length > 256) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  const usernameKey = body.username.trim().toLowerCase();
  if (!usernameKey) return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  try {
   return await prosesLogin(usernameKey, body.password as string);
  } catch (e) {
   const msg = e instanceof Error ? e.message : "";
   if (/StudentSession|does not exist|P2021|Unknown argument/i.test(msg)) return NextResponse.json({ error: "Skema database belum diperbarui. Jalankan `npx prisma migrate deploy` dan `npx prisma generate` di folder aplikasi, lalu restart dev server." }, { status: 500 });
   console.error("[exam/login]", e);
   return NextResponse.json({ error: "Kesalahan server saat login. Periksa log terminal server." }, { status: 500 });
  }
}
async function prosesLogin(usernameKey: string, password: string) {
  const accounts = await db.examAccount.findMany({ where: { usernameKey }, include: { examPeriod: true, student: true } });
  const account = accounts.find(a => !a.examPeriod.archivedAt && verifyPassword(password, a.passwordHash)) ?? accounts.find(a => verifyPassword(password, a.passwordHash));
  if (!account) return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
  await db.studentSession.create({ data: { examAccountId: account.id, tokenHash: hashToken(token), expiresAt } });
  const response = NextResponse.json({ ok: true, studentName: account.student.name });
  response.cookies.set(STUDENT_COOKIE_NAME, token, { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE === "true", path: "/", expires: expiresAt });
  return response;
}
