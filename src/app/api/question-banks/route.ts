import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
function fields(b:{title?:unknown;subject?:unknown;description?:unknown}){
 const title=typeof b.title==="string"?b.title.trim().replace(/\s+/g," "):"";
 const subject=typeof b.subject==="string"?b.subject.trim():"";
 const description=typeof b.description==="string"?b.description.trim():"";
 if(!title||title.length>120||!subject||subject.length>100||description.length>500)return null;
 return {title,subject,description:description||null};
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{title?:unknown;subject?:unknown;description?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 const data=fields(b);if(!data)return NextResponse.json({error:"Judul bank dan mata pelajaran wajib diisi."},{status:400});
 try{await db.questionBank.create({data});return NextResponse.json({ok:true})}
 catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return NextResponse.json({error:"Judul bank soal tersebut sudah ada."},{status:409});console.error(e);return NextResponse.json({error:"Tidak dapat menyimpan bank soal."},{status:500})}
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown;action?:unknown;title?:unknown;subject?:unknown;description?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Bank soal tidak valid."},{status:400});
 try{
  if(b.action==="edit"){
   const data=fields(b);if(!data)return NextResponse.json({error:"Periksa judul bank dan mata pelajaran."},{status:400});
   await db.questionBank.update({where:{id:b.id},data});return NextResponse.json({ok:true});
  }
  if(b.action==="archive"||b.action==="restore"){
   await db.questionBank.update({where:{id:b.id},data:{archivedAt:b.action==="archive"?new Date():null}});
   return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Tindakan tidak valid."},{status:400});
 }catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return NextResponse.json({error:"Judul bank soal tersebut sudah ada."},{status:409});if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2025")return NextResponse.json({error:"Bank soal tidak ditemukan."},{status:404});console.error(e);return NextResponse.json({error:"Tidak dapat mengubah bank soal."},{status:500})}
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Bank soal tidak valid."},{status:400});
 const items=await db.testItem.count({where:{bankId:b.id}});
 if(items>0)return NextResponse.json({error:`Bank masih berisi ${items} soal. Hapus soal terlebih dahulu atau arsipkan bank.`},{status:409});
 const deleted=await db.questionBank.deleteMany({where:{id:b.id}});
 if(!deleted.count)return NextResponse.json({error:"Bank soal tidak ditemukan atau sudah dihapus."},{status:404});
 return NextResponse.json({ok:true});
}
