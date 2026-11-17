import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentStudent } from "@/lib/auth";
import { finalizeAttempt } from "@/lib/exam";
export const runtime = "nodejs";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const st = await getCurrentStudent();
  if (!st) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const { id } = await params;
  const attempt = await db.examAttempt.findUnique({ where: { id } });
  if (!attempt || attempt.studentId !== st.studentId) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  const done = await finalizeAttempt(attempt.id);
  return NextResponse.json({ ok: true, status: done?.status ?? "SELESAI", score: done?.score ?? null, finishedAt: done?.finishedAt ?? null });
}
