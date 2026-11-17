import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
 if (!isSameOrigin(request) || !(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 let b: { testId?: unknown; studentId?: unknown; score?: unknown; note?: unknown };
 try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
 const testId = typeof b.testId === "string" ? b.testId : "";
 const studentId = typeof b.studentId === "string" ? b.studentId : "";
 if (!testId || !studentId) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
 const score = b.score === null || b.score === "" ? null : Number(b.score);
 if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) return NextResponse.json({ error: "Nilai akhir harus bilangan 0-100 atau kosongkan." }, { status: 400 });
 const note = typeof b.note === "string" ? b.note.slice(0, 300) : "";
 const row = await db.finalGrade.upsert({ where: { testId_studentId: { testId, studentId } }, update: { score, note }, create: { testId, studentId, score, note } });
 return NextResponse.json({ ok: true, score: row.score, note: row.note });
}
