import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentStudent } from "@/lib/auth";
import { attemptPayload, drawItems, finalizeIfExpired } from "@/lib/exam";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const st = await getCurrentStudent();
  if (!st) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  let b: { executionId?: unknown };
  try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const executionId = typeof b.executionId === "string" ? b.executionId : "";
  if (!executionId) return NextResponse.json({ error: "Pelaksanaan tidak valid." }, { status: 400 });
  const assigned = await db.testAssignment.findUnique({ where: { executionId_studentId: { executionId, studentId: st.studentId } } });
  if (!assigned) return NextResponse.json({ error: "Anda tidak terdaftar pada pelaksanaan ini." }, { status: 403 });
  const existing = await db.examAttempt.findUnique({ where: { executionId_studentId: { executionId, studentId: st.studentId } }, include: { items: true, execution: { include: { test: true } } } });
  if (existing) {
    const done = await finalizeIfExpired(existing);
    if (!done) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true, attempt: attemptPayload(done, { testTitle: existing.execution.test.title, kind: existing.execution.kind, roomLabel: existing.execution.roomLabel, shuffleQuestions: existing.execution.shuffleQuestions }) });
  }
  const exec = await db.testExecution.findUnique({ where: { id: executionId }, include: { test: true } });
  if (!exec || exec.archivedAt) return NextResponse.json({ error: "Pelaksanaan tidak ditemukan." }, { status: 404 });
  const now = new Date();
  const endsAt = new Date(Math.min(exec.startAt.getTime() + exec.durationMinutes * 60000, exec.endAt.getTime()));
  if (now < exec.startAt) return NextResponse.json({ error: `Pelaksanaan belum dimulai. Jadwal mulai ${new Date(exec.startAt).toLocaleString("id-ID")}.` }, { status: 409 });
  if (now >= endsAt) return NextResponse.json({ error: `Waktu pengerjaan telah berakhir pada ${endsAt.toLocaleString("id-ID")} (durasi dihitung dari jam mulai terjadwal). Hubungi operator untuk susulan.` }, { status: 409 });
  const drawn = await drawItems(executionId);
  if (!drawn || !drawn.snaps.length) return NextResponse.json({ error: "Komposisi soal pada pelaksanaan ini kosong. Hubungi operator." }, { status: 409 });
  const attempt = await db.$transaction(async tx => {
    const a = await tx.examAttempt.create({ data: { executionId, studentId: st.studentId, startedAt: now, endsAt } });
    await tx.examAttemptItem.createMany({ data: drawn.snaps.map((s, i) => ({ attemptId: a.id, order: i + 1, question: s.question, options: s.options, correctIndex: s.correctIndex })) });
    return tx.examAttempt.findUniqueOrThrow({ where: { id: a.id }, include: { items: true } });
  });
  return NextResponse.json({ ok: true, attempt: attemptPayload(attempt, { testTitle: exec.test.title, kind: exec.kind, roomLabel: exec.roomLabel, shuffleQuestions: exec.shuffleQuestions }) });
}
