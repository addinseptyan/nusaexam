import { NextResponse } from "next/server";
import { createBackup, isSameOriginGuard, listBackups, restoreBackup } from "./helpers";
export const runtime = "nodejs";
export async function GET(request: Request) {
 if (!await isSameOriginGuard(request)) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 return NextResponse.json({ ok: true, rows: await listBackups() });
}
export async function POST(request: Request) {
 if (!await isSameOriginGuard(request)) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 let b: { action?: unknown; file?: unknown };
 try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
 try {
  if (b.action === "create") return NextResponse.json({ ok: true, name: await createBackup() });
  if (b.action === "restore" && typeof b.file === "string") return NextResponse.json({ ok: true, counts: await restoreBackup(b.file) });
  if (b.action === "delete" && typeof b.file === "string") { const { deleteBackup } = await import("./helpers"); await deleteBackup(b.file); return NextResponse.json({ ok: true }); }
 } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Proses backup gagal." }, { status: 400 }); }
 return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
