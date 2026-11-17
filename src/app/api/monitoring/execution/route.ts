import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { finalizeAttempt } from "@/lib/exam";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const executionId = new URL(request.url).searchParams.get("executionId") || "";
  if (!executionId) return NextResponse.json({ error: "Pelaksanaan tidak valid." }, { status: 400 });
  const exec = await db.testExecution.findUnique({ where: { id: executionId }, include: { test: true, examPeriod: true, assignments: { include: { student: { include: { enrollments: { include: { classroom: true } } } } } } } });
  if (!exec) return NextResponse.json({ error: "Pelaksanaan tidak ditemukan." }, { status: 404 });
  const now = new Date();
  const effEnd = new Date(Math.min(exec.startAt.getTime() + exec.durationMinutes * 60000, exec.endAt.getTime()));
  let attempts = await db.examAttempt.findMany({ where: { executionId }, include: { items: { select: { answer: true, marked: true } } } });
  const expired = attempts.filter(a => a.status === "MULAI" && now > a.endsAt);
  if (expired.length) {
    const fixed = await Promise.all(expired.map(a => finalizeAttempt(a.id)));
    attempts = attempts.map(a => fixed.find(f => f?.id === a.id) ?? a);
  }
  const byStudent = new Map(attempts.map(a => [a.studentId, a]));
  const rows = exec.assignments.map(as => {
    const at = byStudent.get(as.student.id) ?? null;
    const enrollment = as.student.enrollments.find(e => e.academicYearId === exec.examPeriod.academicYearId);
    const base = { studentId: as.student.id, name: as.student.name, className: enrollment?.classroom.name ?? "—" };
    if (!at) return { ...base, status: now >= effEnd ? "ABSEN" : "BELUM", answered: 0, total: 0, marked: 0, sisaMenit: 0, score: null as number | null, finishedAt: null as string | null };
    const answered = at.items.filter(i => i.answer !== null).length;
    const marked = at.items.filter(i => i.marked).length;
    if (at.status === "MULAI") return { ...base, status: "BERLANGSUNG", answered, total: at.items.length, marked, sisaMenit: Math.max(0, Math.ceil((at.endsAt.getTime() - now.getTime()) / 60000)), score: null, finishedAt: null };
    return { ...base, status: "SELESAI", answered, total: at.items.length, marked, sisaMenit: 0, score: at.score, finishedAt: at.finishedAt ? at.finishedAt.toISOString() : null };
  }).sort((a, b) => a.name.localeCompare(b.name, "id"));
  const count = (s: string) => rows.filter(r => r.status === s).length;
  const scores = rows.filter(r => r.score !== null).map(r => r.score as number);
  const summary = { total: rows.length, belum: count("BELUM"), berlangsung: count("BERLANGSUNG"), selesai: count("SELESAI"), absen: count("ABSEN"), rata: scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null };
  return NextResponse.json({ ok: true, serverNow: now.toISOString(), execution: { id: exec.id, title: exec.test.title, kind: exec.kind, roomLabel: exec.roomLabel, startAt: exec.startAt, endAt: exec.endAt, endsAt: effEnd, durationMinutes: exec.durationMinutes, periodName: exec.examPeriod.name }, summary, rows });
}
