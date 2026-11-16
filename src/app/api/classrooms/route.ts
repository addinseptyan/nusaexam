import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { mutationError, readBody } from "@/lib/academic-errors";
const DUPLICATE="Nama kelas sudah digunakan pada tahun ajaran ini, termasuk kelas yang diarsipkan.";
function fields(b:Record<string,unknown>){
 const name=typeof b.name==="string"?b.name.trim().replace(/\s+/g," "):"";
 const academicYearId=typeof b.academicYearId==="string"?b.academicYearId:"";
 const departmentId=typeof b.departmentId==="string"?b.departmentId:"";
 const grade=typeof b.grade==="number"?b.grade:0;
 if(!name||name.length>100||!academicYearId||academicYearId.length>100||!departmentId||departmentId.length>100||![10,11,12].includes(grade))return null;
 return {name,nameKey:name.normalize("NFKC").toUpperCase(),academicYearId,departmentId,grade};
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 const b=await readBody(request);const data=b&&fields(b);
 if(!data)return NextResponse.json({error:"Lengkapi nama kelas, tingkat, tahun ajaran dan jurusan."},{status:400});
 try{
  const result=await db.$transaction(async(tx)=>{
   if(!await tx.academicYear.findUnique({where:{id:data.academicYearId}}))return "year";
   if(!await tx.department.findFirst({where:{id:data.departmentId,archivedAt:null}}))return "department";
   await tx.classroom.create({data});return "ok";
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  if(result!=="ok")return NextResponse.json({error:result==="year"?"Tahun ajaran tidak ditemukan.":"Jurusan tidak ditemukan atau telah diarsipkan."},{status:400});
  return NextResponse.json({ok:true});
 }catch(e){return mutationError(e,DUPLICATE)}
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 const b=await readBody(request);if(!b||typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Kelas tidak valid."},{status:400});
 const id=b.id;
 try{
  if(b.action==="edit"){
   const data=fields(b);if(!data)return NextResponse.json({error:"Periksa data kelas."},{status:400});
   const result=await db.$transaction(async(tx)=>{
    if(!await tx.academicYear.findUnique({where:{id:data.academicYearId}}))return "year";
    if(!await tx.department.findFirst({where:{id:data.departmentId,archivedAt:null}}))return "department";
    const changed=await tx.classroom.updateMany({where:{id,archivedAt:null},data});return changed.count?"ok":"changed";
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   if(result!=="ok")return NextResponse.json({error:result==="changed"?"Kelas tidak ditemukan atau sudah diarsipkan.":"Tahun ajaran atau jurusan tidak tersedia."},{status:409});
   return NextResponse.json({ok:true});
  }
  if(b.action==="archive"||b.action==="restore"){
   const action=b.action;
   const result=await db.$transaction(async(tx)=>{
    const c=await tx.classroom.findUnique({where:{id},include:{department:true}});
    if(!c || (action==="archive"?Boolean(c.archivedAt):!c.archivedAt))return "changed";
    if(action==="restore"&&c.department.archivedAt)return "department";
    await tx.classroom.update({where:{id},data:{archivedAt:action==="archive"?new Date():null}});return "ok";
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   if(result!=="ok")return NextResponse.json({error:result==="department"?"Pulihkan jurusan terlebih dahulu.":"Kelas tidak ditemukan atau status sudah berubah."},{status:409});
   return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Tindakan tidak valid."},{status:400});
 }catch(e){return mutationError(e,DUPLICATE)}
}
