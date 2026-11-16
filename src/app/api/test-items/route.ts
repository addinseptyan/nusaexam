import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
function fields(b:{question?:unknown;options?:unknown;correctIndex?:unknown}){
 const question=typeof b.question==="string"?b.question.trim():"";
 if(!question||question.length>2000)return null;
 if(!Array.isArray(b.options))return null;
 const options=b.options.map(o=>typeof o==="string"?o.trim():"").filter(o=>o.length>0&&o.length<=500);
 if(options.length<2||options.length!==b.options.length)return null;
 const correctIndex=Number(b.correctIndex);
 if(!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=options.length)return null;
 return {question,options,correctIndex};
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{bankId?:unknown;question?:unknown;options?:unknown;correctIndex?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.bankId!=="string"||!b.bankId||b.bankId.length>100)return NextResponse.json({error:"Bank soal tidak valid."},{status:400});
 const data=fields(b);if(!data)return NextResponse.json({error:"Soal wajib diisi; pilihan 2-5 opsi masing-masing maks. 500 karakter; kunci jawaban harus salah satu opsi."},{status:400});
 const bank=await db.questionBank.findUnique({where:{id:b.bankId}});
 if(!bank)return NextResponse.json({error:"Bank soal tidak ditemukan."},{status:404});
 const last=await db.testItem.aggregate({where:{bankId:bank.id},_max:{order:true}});
 try{await db.testItem.create({data:{bankId:bank.id,order:(last._max.order||0)+1,...data}});return NextResponse.json({ok:true})}
 catch(e){console.error(e);return NextResponse.json({error:"Tidak dapat menyimpan soal."},{status:500})}
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown;question?:unknown;options?:unknown;correctIndex?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Soal tidak valid."},{status:400});
 const data=fields(b);if(!data)return NextResponse.json({error:"Periksa soal, pilihan (2-5), dan kunci jawaban."},{status:400});
 const updated=await db.testItem.updateMany({where:{id:b.id},data});
 if(!updated.count)return NextResponse.json({error:"Soal tidak ditemukan."},{status:404});
 return NextResponse.json({ok:true});
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Soal tidak valid."},{status:400});
 const item=await db.testItem.findUnique({where:{id:b.id}});
 if(!item)return NextResponse.json({error:"Soal tidak ditemukan."},{status:404});
 await db.$transaction([
  db.testItem.deleteMany({where:{id:item.id}}),
  db.testItem.updateMany({where:{bankId:item.bankId,order:{gt:item.order}},data:{order:{decrement:1}}})
 ]);
 return NextResponse.json({ok:true});
}
