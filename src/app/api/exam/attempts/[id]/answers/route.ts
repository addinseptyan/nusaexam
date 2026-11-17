import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentStudent } from "@/lib/auth";
import { finalizeAttempt } from "@/lib/exam";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const st = await getCurrentStudent();
  if (!st) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const { id } = await params;
  let b: { itemId?: unknown; selectedIndex?: unknown; marked?: unknown };
  try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const itemId = typeof b.itemId === "string" ? b.itemId : "";
  const hasIndex = b.selectedIndex !== undefined;
  const selectedIndex = b.selectedIndex === null ? null : Number(b.selectedIndex);
  const hasMark = typeof b.marked === "boolean";
  const attempt = await db.examAttempt.findUnique({ where: { id }, include: { items: true } });
  if (!attempt || attempt.studentId !== st.studentId) return NextResponse.json({ error: "Ujian tidak ditemukan." }, { status: 404 });
  if (attempt.status === "SELESAI") return NextResponse.json({ error: "Ujian sudah selesai.", finished: true, score: attempt.score }, { status: 409 });
  if (new Date() > attempt.endsAt) { const done = await finalizeAttempt(attempt.id); return NextResponse.json({ error: "Waktu pengerjaan telah habis.", finished: true, score: done?.score ?? null }, { status: 409 }); }
  const item = attempt.items.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
  if (hasIndex && selectedIndex !== null && (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= item.options.length)) return NextResponse.json({ error: "Pilihan tidak valid." }, { status: 400 });
  if (!hasIndex && !hasMark) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  await db.examAttemptItem.update({ where: { id: itemId }, data: { ...(hasIndex ? { answer: selectedIndex } : {}), ...(hasMark ? { marked: b.marked as boolean } : {}) } });
  return NextResponse.json({ ok: true, serverNow: new Date().toISOString() });
}
