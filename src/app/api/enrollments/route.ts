import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
const SAME_YEAR="Peserta ini sudah memiliki kelas pada tahun ajaran tersebut. Gunakan menu Ubah untuk memindahkan kelasnya.";
function idOf(b:{id?:unknown}){return typeof b.id==="string"&&b.id&&b.id.length<=100?b.id:null}
async function activeClassroom(id:unknown){
 if(typeof id!=="string"||!id||id.length>100)return null;
 const c=await db.classroom.findUnique({where:{id}});
 return c&&!c.archivedAt?c:null;
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{studentId?:unknown;studentIds?:unknown;classroomId?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 const raw=Array.isArray(b.studentIds)?b.studentIds:(typeof b.studentId==="string"?[b.studentId]:[]);
 const ids=[...new Set(raw.filter((x):x is string=>typeof x==="string"&&x.length>0&&x.length<=100))];
 if(!ids.length)return NextResponse.json({error:"Pilih minimal satu peserta."},{status:400});
 if(ids.length>200)return NextResponse.json({error:"Maksimal 200 peserta per satu penyimpanan."},{status:400});
 const classroom=await activeClassroom(b.classroomId);
 if(!classroom)return NextResponse.json({error:"Kelas tujuan tidak ditemukan atau sudah diarsipkan."},{status:400});
 const students=await db.student.findMany({where:{id:{in:ids}}});
 const valid=students.filter(s=>!s.archivedAt);
 const skippedInvalid=students.filter(s=>s.archivedAt).map(s=>s.name);
 const existing=await db.enrollment.findMany({where:{academicYearId:classroom.academicYearId,studentId:{in:valid.map(s=>s.id)}},include:{student:true}});
 const existingIds=new Set(existing.map(e=>e.studentId));
 const skippedExisting=existing.map(e=>e.student.name);
 const toCreate=valid.filter(s=>!existingIds.has(s.id));
 let placed=0;
 if(toCreate.length){
  try{
   const result=await db.enrollment.createMany({data:toCreate.map(s=>({studentId:s.id,classroomId:classroom.id,academicYearId:classroom.academicYearId}))});
   placed=result.count;
  }catch(e){
   if(!(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")){console.error("Gagal membuat penempatan:",e);return NextResponse.json({error:"Tidak dapat menyimpan penempatan."},{status:500})}
   for(const s of toCreate){
    try{await db.enrollment.create({data:{studentId:s.id,classroomId:classroom.id,academicYearId:classroom.academicYearId}});placed++}
    catch(err){if(err instanceof Prisma.PrismaClientKnownRequestError&&err.code==="P2002"){skippedExisting.push(s.name);continue}throw err}
   }
  }
 }
 return NextResponse.json({ok:true,placed,skippedExisting,skippedInvalid});
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown;classroomId?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 const id=idOf(b);if(!id)return NextResponse.json({error:"Penempatan tidak valid."},{status:400});
 const current=await db.enrollment.findUnique({where:{id}});
 if(!current)return NextResponse.json({error:"Penempatan tidak ditemukan."},{status:404});
 const classroom=await activeClassroom(b.classroomId);
 if(!classroom)return NextResponse.json({error:"Kelas tujuan tidak ditemukan atau sudah diarsipkan."},{status:400});
 if(classroom.academicYearId!==current.academicYearId)return NextResponse.json({error:"Kelas tujuan berada pada tahun ajaran berbeda. Penempatan lama tetap menjadi riwayat; buat penempatan baru hanya jika peserta naik tahun ajaran."},{status:400});
 if(classroom.id===current.classroomId)return NextResponse.json({error:"Kelas tujuan sama dengan kelas saat ini."},{status:400});
 try{
  await db.enrollment.update({where:{id},data:{classroomId:classroom.id}});
  return NextResponse.json({ok:true});
 }catch(e){
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return NextResponse.json({error:SAME_YEAR},{status:409});
  console.error("Gagal memindahkan penempatan:",e);
  return NextResponse.json({error:"Tidak dapat memindahkan peserta."},{status:500});
 }
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 const id=idOf(b);if(!id)return NextResponse.json({error:"Penempatan tidak valid."},{status:400});
 try{
  const deleted=await db.enrollment.deleteMany({where:{id}});
  if(!deleted.count)return NextResponse.json({error:"Penempatan tidak ditemukan atau sudah dihapus."},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Penempatan masih digunakan oleh data lain sehingga tidak dapat dihapus."},{status:409})}
}
