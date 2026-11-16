import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{executionId?:unknown;studentIds?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.executionId!=="string"||!b.executionId||b.executionId.length>100)return NextResponse.json({error:"Pelaksanaan tidak valid."},{status:400});
 const execution=await db.testExecution.findUnique({where:{id:b.executionId}});
 if(!execution)return NextResponse.json({error:"Pelaksanaan tidak ditemukan."},{status:404});
 const raw=Array.isArray(b.studentIds)?b.studentIds:[];
 const ids=[...new Set(raw.filter((x):x is string=>typeof x==="string"&&x.length>0&&x.length<=100))];
 if(!ids.length)return NextResponse.json({error:"Pilih minimal satu peserta."},{status:400});
 if(ids.length>500)return NextResponse.json({error:"Maksimal 500 peserta per penugasan."},{status:400});
 const accounts=await db.examAccount.findMany({where:{examPeriodId:execution.examPeriodId,studentId:{in:ids}}});
 const eligible=new Set(accounts.map(a=>a.studentId));
 const skipped=ids.filter(id=>!eligible.has(id)).length;
 const existing=await db.testAssignment.findMany({where:{executionId:execution.id,studentId:{in:ids}}});
 const taken=new Set(existing.map(a=>a.studentId));
 const fresh=ids.filter(id=>eligible.has(id)&&!taken.has(id));
 if(fresh.length){
  await db.testAssignment.createMany({data:fresh.map(studentId=>({executionId:execution.id,studentId}))});
 }
 return NextResponse.json({ok:true,assigned:fresh.length,skippedNoAccount:skipped,skippedExisting:taken.size});
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Penugasan tidak valid."},{status:400});
 const deleted=await db.testAssignment.deleteMany({where:{id:b.id}});
 if(!deleted.count)return NextResponse.json({error:"Penugasan tidak ditemukan atau sudah dihapus."},{status:404});
 return NextResponse.json({ok:true});
}
