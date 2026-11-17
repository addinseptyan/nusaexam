import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentStudent } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  const st = await getCurrentStudent();
  if (!st) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const now = new Date();
  const assigns = await db.testAssignment.findMany({ where: { studentId: st.studentId }, include: { execution: { include: { test: true, attempts: { where: { studentId: st.studentId } } } } } });
  const rows = assigns.map(a => {
    const e = a.execution; const at = e.attempts[0];
    const effEnd = new Date(Math.min(new Date(e.startAt).getTime() + e.durationMinutes * 60000, new Date(e.endAt).getTime()));
    const state = at?.status === "SELESAI" ? "SELESAI" : now < e.startAt ? "BELUM" : now >= effEnd ? "LEWAT" : "AKTIF";
    return { executionId: e.id, attemptId: at?.id ?? null, state, testTitle: e.test.title, kind: e.kind, roomLabel: e.roomLabel, startAt: e.startAt, endAt: e.endAt, endsAt: effEnd, durationMinutes: e.durationMinutes, score: at?.status === "SELESAI" ? at.score : null };
  }).sort((x, y) => +new Date(x.startAt) - +new Date(y.startAt));
  return NextResponse.json({ ok: true, rows });
}
