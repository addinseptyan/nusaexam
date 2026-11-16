import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  let body: { label?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const match = /^(\d{4})\/(\d{4})$/.exec(label);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 2199 || Number(match[2]) !== Number(match[1]) + 1) {
    return NextResponse.json({ error: "Gunakan tahun berurutan dengan format YYYY/YYYY, contoh 2026/2027." }, { status: 400 });
  }
  try {
    await db.academicYear.create({ data: { label } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "Tahun ajaran tersebut sudah ada." }, { status: 409 });
    console.error("Gagal membuat tahun ajaran:", e);
    return NextResponse.json({ error: "Tidak dapat menyimpan tahun ajaran." }, { status: 500 });
  }
}
