import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { BACKUP_RE, backupDir } from "@/lib/backup";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(request: Request) {
 if (!isSameOrigin(request) || !(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 const file = new URL(request.url).searchParams.get("file") || "";
 if (!BACKUP_RE.test(file)) return NextResponse.json({ error: "Berkas tidak valid." }, { status: 400 });
 const data = await fs.readFile(path.join(backupDir(), file)).catch(() => null);
 if (!data) return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
 return new NextResponse(new Uint8Array(data), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="${file}"` } });
}
