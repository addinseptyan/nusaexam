import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
export async function POST(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 let body: Record<string, unknown>;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
 if (!body || typeof body !== "object") return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
 const { appName, schoolName, description, primaryColor, sidebarColor } = body;
 if (typeof appName !== "string" || !appName.trim() || appName.trim().length > 60 || typeof schoolName !== "string" || !schoolName.trim() || schoolName.trim().length > 120 || typeof description !== "string" || description.trim().length > 160 || typeof primaryColor !== "string" || !/^#[0-9a-f]{6}$/i.test(primaryColor) || typeof sidebarColor !== "string" || !/^#[0-9a-f]{6}$/i.test(sidebarColor)) return NextResponse.json({ error: "Periksa nama dan kode warna yang dimasukkan." }, { status: 400 });
 const data = { appName: appName.trim(), schoolName: schoolName.trim(), description: description.trim(), primaryColor, sidebarColor };
 await db.appSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
 return NextResponse.json({ ok: true });
}
