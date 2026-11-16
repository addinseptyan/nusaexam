import { ExecutionKind, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
const KINDS=["REGULER","SUSULAN","REMIDI"];
function fields(b:{testId?:unknown;examPeriodId?:unknown;kind?:unknown;roomLabel?:unknown;startAt?:unknown;endAt?:unknown;durationMinutes?:unknown;shuffleQuestions?:unknown;shuffleOptions?:unknown}){
 if(typeof b.testId!=="string"||!b.testId||typeof b.examPeriodId!=="string"||!b.examPeriodId)return null;
 const kind=(typeof b.kind==="string"&&KINDS.includes(b.kind)?b.kind:null) as ExecutionKind|null;
 const roomLabel=typeof b.roomLabel==="string"&&b.roomLabel.trim()?b.roomLabel.trim().slice(0,60):null;
 const startAt=typeof b.startAt==="string"?new Date(b.startAt):null;
 const endAt=typeof b.endAt==="string"?new Date(b.endAt):null;
 const durationMinutes=Number(b.durationMinutes);
 if(!kind||!roomLabel||!startAt||!endAt||Number.isNaN(startAt.getTime())||Number.isNaN(endAt.getTime()))return null;
 if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>600)return null;
 if(endAt<=startAt)return null;
 if(durationMinutes*60000>endAt.getTime()-startAt.getTime())return null;
 return {testId:b.testId,examPeriodId:b.examPeriodId,kind,roomLabel,startAt,endAt,durationMinutes,shuffleQuestions:b.shuffleQuestions!==false,shuffleOptions:b.shuffleOptions!==false};
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:Parameters<typeof fields>[0];
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 const data=fields(b);
 if(!data)return NextResponse.json({error:"Periksa tes, periode, jenis, ruang, dan waktu: selesai harus setelah mulai, durasi 1-600 menit dan tidak melebihi jendela waktu."},{status:400});
 const [test,period]=await Promise.all([db.test.findUnique({where:{id:data.testId}}),db.examPeriod.findUnique({where:{id:data.examPeriodId}})]);
 if(!test||test.archivedAt)return NextResponse.json({error:"Tes tidak ditemukan atau diarsipkan."},{status:400});
 if(!period)return NextResponse.json({error:"Periode tidak ditemukan."},{status:400});
 try{await db.testExecution.create({data});return NextResponse.json({ok:true})}
 catch(e){console.error(e);return NextResponse.json({error:"Tidak dapat menyimpan pelaksanaan."},{status:500})}
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:Parameters<typeof fields>[0]&{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Pelaksanaan tidak valid."},{status:400});
 const data=fields(b);
 if(!data)return NextResponse.json({error:"Periksa kembali isian: selesai setelah mulai, durasi 1-600 menit dan tidak melebihi jendela waktu."},{status:400});
 const updated=await db.testExecution.updateMany({where:{id:b.id},data});
 if(!updated.count)return NextResponse.json({error:"Pelaksanaan tidak ditemukan."},{status:404});
 return NextResponse.json({ok:true});
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Pelaksanaan tidak valid."},{status:400});
 const deleted=await db.testExecution.deleteMany({where:{id:b.id}});
 if(!deleted.count)return NextResponse.json({error:"Pelaksanaan tidak ditemukan atau sudah dihapus."},{status:404});
 return NextResponse.json({ok:true});
}
