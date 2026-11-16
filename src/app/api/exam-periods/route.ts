import { NextResponse } from "next/server";
import { Prisma, Semester } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
function parseFields(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const academicYearId = typeof body.academicYearId === "string" ? body.academicYearId : "";
  const semester = body.semester === "GANJIL" ? Semester.GANJIL : body.semester === "GENAP" ? Semester.GENAP : null;
  const startDate = parseDate(body.startDate); const endDate = parseDate(body.endDate);
  if (!name || name.length > 100 || description.length > 500 || !academicYearId || academicYearId.length > 100 || !semester || !startDate || !endDate || startDate > endDate) return null;
  return { name, description, academicYearId, semester, startDate, endDate };
}
async function bodyFrom(request: Request): Promise<Record<string, unknown> | null> {
  try { const data = await request.json(); return data && typeof data === "object" && !Array.isArray(data) ? data : null; } catch { return null; }
}
function errorResult(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Periode dengan nama, semester, dan tahun ajaran yang sama sudah ada." }, { status: 409 });
  console.error("Gagal menyimpan periode:", error);
  return NextResponse.json({ error: "Tidak dapat menyimpan periode." }, { status: 500 });
}
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const body = await bodyFrom(request); const data = body && parseFields(body);
  if (!data) return NextResponse.json({ error: "Periksa nama, tahun ajaran, semester, dan tanggal. Tanggal selesai tidak boleh sebelum tanggal mulai." }, { status: 400 });
  if (!await db.academicYear.findUnique({ where: { id: data.academicYearId } })) return NextResponse.json({ error: "Tahun ajaran tidak ditemukan." }, { status: 400 });
  try { await db.examPeriod.create({ data }); return NextResponse.json({ ok: true }); } catch (e) { return errorResult(e); }
}
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  const body = await bodyFrom(request);
  if (!body || typeof body.id !== "string" || !body.id || body.id.length > 100) return NextResponse.json({ error: "Periode tidak valid." }, { status: 400 });
  try {
    if (body.action === "archive" || body.action === "restore") {
      const archivedAt = body.action === "archive" ? new Date() : null;
      const changed = await db.examPeriod.updateMany({ where: { id: body.id, archivedAt: body.action === "archive" ? null : { not: null } }, data: { archivedAt } });
      if (!changed.count) return NextResponse.json({ error: "Periode tidak ditemukan atau statusnya sudah berubah." }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    if (body.action !== "edit") return NextResponse.json({ error: "Tindakan tidak valid." }, { status: 400 });
    const data = parseFields(body);
    if (!data) return NextResponse.json({ error: "Periksa nama, tahun ajaran, semester, dan tanggal. Tanggal selesai tidak boleh sebelum tanggal mulai." }, { status: 400 });
    if (!await db.academicYear.findUnique({ where: { id: data.academicYearId } })) return NextResponse.json({ error: "Tahun ajaran tidak ditemukan." }, { status: 400 });
    const changed = await db.examPeriod.updateMany({ where: { id: body.id, archivedAt: null }, data });
    if (!changed.count) return NextResponse.json({ error: "Periode tidak ditemukan atau sudah diarsipkan." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (e) { return errorResult(e); }
}
