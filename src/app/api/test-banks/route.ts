import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{testId?:unknown;bankId?:unknown;count?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.testId!=="string"||!b.testId||typeof b.bankId!=="string"||!b.bankId)return NextResponse.json({error:"Pilih tes dan bank soal."},{status:400});
 const count=Number(b.count);
 if(!Number.isInteger(count)||count<1||count>500)return NextResponse.json({error:"Jumlah soal diambil harus 1-500."},{status:400});
 const bank=await db.questionBank.findUnique({where:{id:b.bankId}});
 if(!bank||bank.archivedAt)return NextResponse.json({error:"Bank soal tidak ditemukan atau diarsipkan."},{status:400});
 const total=await db.testItem.count({where:{bankId:bank.id}});
 if(count>total)return NextResponse.json({error:`Bank “${bank.title}” hanya memiliki ${total} soal; minta maksimal sejumlah itu.`},{status:400});
 try{await db.testBank.create({data:{testId:b.testId,bankId:b.bankId,count}});return NextResponse.json({ok:true})}
 catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return NextResponse.json({error:"Bank tersebut sudah terhubung ke tes ini. Ubah jumlahnya lewat menu Ubah."},{status:409});console.error(e);return NextResponse.json({error:"Tidak dapat menghubungkan bank ke tes."},{status:500})}
}
export async function PATCH(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown;count?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Komposisi tidak valid."},{status:400});
 const count=Number(b.count);
 if(!Number.isInteger(count)||count<1||count>500)return NextResponse.json({error:"Jumlah soal diambil harus 1-500."},{status:400});
 const link=await db.testBank.findUnique({where:{id:b.id},include:{bank:{include:{_count:{select:{items:true}}}}}});
 if(!link)return NextResponse.json({error:"Komposisi tidak ditemukan."},{status:404});
 if(count>link.bank._count.items)return NextResponse.json({error:`Bank “${link.bank.title}” hanya memiliki ${link.bank._count.items} soal.`},{status:400});
 await db.testBank.update({where:{id:b.id},data:{count}});
 return NextResponse.json({ok:true});
}
export async function DELETE(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{id?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.id!=="string"||!b.id||b.id.length>100)return NextResponse.json({error:"Komposisi tidak valid."},{status:400});
 const deleted=await db.testBank.deleteMany({where:{id:b.id}});
 if(!deleted.count)return NextResponse.json({error:"Komposisi tidak ditemukan atau sudah dihapus."},{status:404});
 return NextResponse.json({ok:true});
}
