import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { mutationError, readBody } from "@/lib/academic-errors";

const DUPLICATE = "NIS atau NISN sudah digunakan oleh peserta lain, termasuk peserta yang diarsipkan.";
function fields(body: Record<string, unknown>) {
 const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
 const nis = typeof body.nis === "string" ? body.nis.trim() : "";
 const nisn = typeof body.nisn === "string" ? body.nisn.trim() : "";
 if (!name || name.length > 120 || nis.length > 32 || /[\u0000-\u001f\u007f]/.test(nis) || (nisn && !/^\d{10}$/.test(nisn))) return null;
 return { name, nis: nis || null, nisKey: nis ? nis.normalize("NFKC").toUpperCase() : null, nisn: nisn || null };
}
export async function POST(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 const body = await readBody(request); const data = body && fields(body);
 if (!data) return NextResponse.json({ error: "Periksa nama, NIS (maksimal 32 karakter), dan NISN (10 angka jika diisi)." }, { status: 400 });
 try { await db.student.create({ data }); return NextResponse.json({ ok: true }); } catch (e) { return mutationError(e, DUPLICATE); }
}
export async function PATCH(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 const body = await readBody(request);
 if (!body || typeof body.id !== "string" || !body.id || body.id.length > 100) return NextResponse.json({ error: "Peserta tidak valid." }, { status: 400 });
 try {
  if (body.action === "edit") {
   const data = fields(body);
   if (!data) return NextResponse.json({ error: "Periksa nama, NIS, dan NISN (10 angka jika diisi)." }, { status: 400 });
   const changed = await db.student.updateMany({ where: { id: body.id, archivedAt: null }, data });
   if (!changed.count) return NextResponse.json({ error: "Peserta tidak ditemukan atau telah diarsipkan." }, { status: 409 });
   return NextResponse.json({ ok: true });
  }
  if (body.action === "archive" || body.action === "restore") {
   const archivedAt = body.action === "archive" ? new Date() : null;
   const changed = await db.student.updateMany({ where: { id: body.id, archivedAt: body.action === "archive" ? null : { not: null } }, data: { archivedAt } });
   if (!changed.count) return NextResponse.json({ error: "Peserta tidak ditemukan atau statusnya sudah berubah." }, { status: 409 });
   return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Tindakan tidak valid." }, { status: 400 });
 } catch (e) { return mutationError(e, DUPLICATE); }
}

export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Peserta tidak valid."},{status:400});
 try{
  const deleted=await db.student.deleteMany({where:{id:b.id}});
  if(!deleted.count)return NextResponse.json({error:"Peserta tidak ditemukan atau sudah dihapus."},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Peserta masih digunakan oleh data lain sehingga tidak dapat dihapus."},{status:409})}
}
