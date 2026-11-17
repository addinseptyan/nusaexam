import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const testId = new URL(request.url).searchParams.get("testId") || "";
  if (!testId) return NextResponse.json({ error: "Tes tidak valid." }, { status: 400 });
  const test = await db.test.findUnique({ where: { id: testId } });
  if (!test) return NextResponse.json({ error: "Tes tidak ditemukan." }, { status: 404 });
  const execs = await db.testExecution.findMany({ where: { testId }, include: { examPeriod: true, attempts: true, assignments: { include: { student: { include: { enrollments: { include: { classroom: true } } } } } } } });
  const map = new Map<string, { studentId: string; name: string; className: string; reguler: number | null; susulan: number | null; remidi: number | null; flag: boolean }>();
  const slot = (studentId: string, name: string, className: string) => {
    let r = map.get(studentId);
    if (!r) { r = { studentId, name, className, reguler: null, susulan: null, remidi: null, flag: false }; map.set(studentId, r); }
    return r;
  };
  for (const exec of execs) {
    for (const as of exec.assignments) {
      const enrollment = as.student.enrollments.find(e => e.academicYearId === exec.examPeriod.academicYearId);
      const row = slot(as.student.id, as.student.name, enrollment?.classroom.name ?? "—");
      const at = exec.attempts.find(a => a.studentId === as.student.id && a.status === "SELESAI");
      if (!at) continue;
      if (exec.kind === "REGULER") row.reguler = at.score;
      else if (exec.kind === "SUSULAN") row.susulan = at.score;
      else row.remidi = at.score;
    }
  }
  const finals = await db.finalGrade.findMany({ where: { testId } });
  const finalBy = new Map(finals.map(f => [f.studentId, f]));
  const rows = [...map.values()].map(r => {
    const main = r.reguler ?? r.susulan;
    return { ...r, main, flag: r.reguler !== null && r.susulan !== null, final: finalBy.get(r.studentId)?.score ?? null };
  }).sort((a, b) => a.name.localeCompare(b.name, "id"));
  return NextResponse.json({ ok: true, test: { id: test.id, title: test.title }, rows });
}
