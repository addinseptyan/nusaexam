import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentStudent } from "@/lib/auth";
import { attemptPayload, finalizeIfExpired } from "@/lib/exam";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const st = await getCurrentStudent();
  if (!st) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const { id } = await params;
  const attempt = await db.examAttempt.findUnique({ where: { id }, include: { items: true, execution: { include: { test: true } } } });
  if (!attempt || attempt.studentId !== st.studentId) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  const done = await finalizeIfExpired(attempt);
  if (!done) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, attempt: attemptPayload(done, { testTitle: attempt.execution.test.title, kind: attempt.execution.kind, roomLabel: attempt.execution.roomLabel, shuffleQuestions: attempt.execution.shuffleQuestions }) });
}
