import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
export function mutationError(error: unknown, duplicate: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return NextResponse.json({ error: duplicate }, { status: 409 });
    if (error.code === "P2034") return NextResponse.json({ error: "Data berubah bersamaan. Muat ulang dan coba lagi." }, { status: 409 });
  }
  console.error("Gagal memperbarui data akademik:", error);
  return NextResponse.json({ error: "Tidak dapat menyimpan data. Coba lagi." }, { status: 500 });
}
export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try { const b = await request.json(); return b && typeof b === "object" && !Array.isArray(b) ? b : null; } catch { return null; }
}
