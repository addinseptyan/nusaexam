import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { mutationError, readBody } from "@/lib/academic-errors";
const DUPLICATE = "Kode jurusan sudah digunakan, termasuk oleh jurusan yang diarsipkan.";
function fields(b:Record<string,unknown>) {
  const code=typeof b.code==="string"?b.code.trim().toUpperCase():"";
  const name=typeof b.name==="string"?b.name.trim():"";
  return /^[A-Z0-9-]{1,12}$/.test(code) && name.length>=1 && name.length<=100 ? {code,name} : null;
}
export async function POST(request:Request){
 if(!isSameOrigin(request)) return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser())) return NextResponse.json({error:"Silakan login kembali."},{status:401});
 const b=await readBody(request);const data=b&&fields(b);
 if(!data)return NextResponse.json({error:"Isi nama dan kode jurusan. Kode maksimal 12 karakter: huruf, angka, atau tanda hubung."},{status:400});
 try{await db.department.create({data});return NextResponse.json({ok:true})}catch(e){return mutationError(e,DUPLICATE)}
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 const b=await readBody(request);if(!b||typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Jurusan tidak valid."},{status:400});
 const id=b.id;
 try{
  if(b.action==="edit"){
   const data=fields(b);if(!data)return NextResponse.json({error:"Periksa nama dan kode jurusan."},{status:400});
   const result=await db.department.updateMany({where:{id,archivedAt:null},data});
   return result.count?NextResponse.json({ok:true}):NextResponse.json({error:"Jurusan tidak ditemukan atau telah diarsipkan."},{status:409});
  }
  if(b.action==="archive"||b.action==="restore"){
   const action=b.action;
   const result=await db.$transaction(async(tx)=>{
    const department=await tx.department.findUnique({where:{id}});
    if(!department || (action==="archive"?Boolean(department.archivedAt):!department.archivedAt))return "changed";
    if(action==="archive" && await tx.classroom.count({where:{departmentId:id,archivedAt:null}})>0)return "used";
    await tx.department.update({where:{id},data:{archivedAt:action==="archive"?new Date():null}});return "ok";
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   if(result==="used")return NextResponse.json({error:"Jurusan masih memiliki kelas yang belum diarsipkan. Arsipkan kelasnya terlebih dahulu."},{status:409});
   if(result!=="ok")return NextResponse.json({error:"Jurusan tidak ditemukan atau status sudah berubah."},{status:409});
   return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Tindakan tidak valid."},{status:400});
 }catch(e){return mutationError(e,DUPLICATE)}
}

export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Jurusan tidak valid."},{status:400});
 const used=await db.classroom.count({where:{departmentId:b.id}});
 if(used>0)return NextResponse.json({error:"Jurusan tidak dapat dihapus permanen karena masih memiliki kelas. Hapus kelasnya terlebih dahulu."},{status:409});
 try{
  const deleted=await db.department.deleteMany({where:{id:b.id}});
  if(!deleted.count)return NextResponse.json({error:"Jurusan tidak ditemukan atau sudah dihapus."},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Jurusan masih digunakan oleh data lain sehingga tidak dapat dihapus."},{status:409})}
}
