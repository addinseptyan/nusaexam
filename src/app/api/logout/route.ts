import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { COOKIE_NAME, hashToken, isSameOrigin } from "@/lib/auth";
export async function POST(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 const token = (await cookies()).get(COOKIE_NAME)?.value;
 if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
 const response = NextResponse.json({ ok: true });
 response.cookies.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE === "true", path: "/", maxAge: 0 });
 return response;
}
