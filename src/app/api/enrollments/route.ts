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
 let b:{studentId?:unknown;classroomId?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.studentId!=="string"||!b.studentId||b.studentId.length>100)return NextResponse.json({error:"Pilih peserta terlebih dahulu."},{status:400});
 const classroom=await activeClassroom(b.classroomId);
 if(!classroom)return NextResponse.json({error:"Kelas tujuan tidak ditemukan atau sudah diarsipkan."},{status:400});
 const student=await db.student.findUnique({where:{id:b.studentId}});
 if(!student||student.archivedAt)return NextResponse.json({error:"Peserta tidak ditemukan atau sudah diarsipkan."},{status:400});
 try{
  await db.enrollment.create({data:{studentId:student.id,classroomId:classroom.id,academicYearId:classroom.academicYearId}});
  return NextResponse.json({ok:true});
 }catch(e){
  if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return NextResponse.json({error:SAME_YEAR},{status:409});
  console.error("Gagal membuat penempatan:",e);
  return NextResponse.json({error:"Tidak dapat menyimpan penempatan."},{status:500});
 }
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
