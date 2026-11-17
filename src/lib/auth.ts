import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
export const COOKIE_NAME = "nusaexam_session";
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) return null;
  return { id: session.user.id, username: session.user.username };
}
// State-changing requests must originate from the exact host and scheme used to access the app.
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try { const u = new URL(origin); return (u.protocol === "http:" || u.protocol === "https:") && u.host === host; } catch { return false; }
}
export const STUDENT_COOKIE_NAME = "nusaexam_student_session";
export async function getCurrentStudent() {
  const token = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.studentSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { examAccount: { include: { student: true, examPeriod: true } } } });
  if (!session || session.expiresAt <= new Date()) return null;
  const a = session.examAccount;
  return { sessionId: session.id, accountId: a.id, studentId: a.studentId, studentName: a.student.name, username: a.username, participantNumber: a.participantNumber, periodId: a.examPeriodId, periodName: a.examPeriod.name };
}
