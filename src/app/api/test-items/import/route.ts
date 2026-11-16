import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ensureMediaDir, IMG_MIME } from "@/lib/media";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
type RawItem={question?:unknown;options?:unknown;correctIndex?:unknown};
function parseItem(raw:RawItem){
 const question=typeof raw.question==="string"?raw.question.trim():"";
 if(!question||question.length>2000)return null;
 if(!Array.isArray(raw.options))return null;
 const options=raw.options.map(o=>typeof o==="string"?o.trim():"").filter(o=>o.length>0&&o.length<=500);
 if(options.length<2||options.length!==raw.options.length)return null;
 const correctIndex=Number(raw.correctIndex);
 if(!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=options.length)return null;
 return {question,options,correctIndex};
}
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{bankId?:unknown;items?:unknown;images?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(typeof b.bankId!=="string"||!b.bankId||b.bankId.length>100)return NextResponse.json({error:"Bank soal tidak valid."},{status:400});
 const bank=await db.questionBank.findUnique({where:{id:b.bankId}});
 if(!bank)return NextResponse.json({error:"Bank soal tidak ditemukan."},{status:404});
 if(!Array.isArray(b.items)||!b.items.length)return NextResponse.json({error:"Tidak ada baris soal yang dapat diimpor."},{status:400});
 type RawImage={mime?:unknown;ext?:unknown;data?:unknown};
 const imagesIn:{mime:string;ext:string;data:string}[]=[];
 if(b.images!==undefined){
  if(!Array.isArray(b.images)||b.images.length>40)return NextResponse.json({error:"Maksimal 40 gambar per satu impor."},{status:400});
  for(const raw of b.images as RawImage[]){
   const ext=typeof raw.ext==="string"?raw.ext.toLowerCase():"";
   const mime=typeof raw.mime==="string"?raw.mime:"";
   if(!IMG_MIME[ext]||IMG_MIME[ext]!==mime||typeof raw.data!=="string"||!raw.data.length)return NextResponse.json({error:"Format gambar tidak didukung."},{status:400});
   const buf=Buffer.from(raw.data,"base64");
   if(!buf.length||buf.length>3*1024*1024)return NextResponse.json({error:"Ukuran gambar maksimal 3 MB."},{status:400});
   imagesIn.push({mime,ext,data:raw.data});
  }
 }
 const metaByIndex:{url:string;alt:string}[]=[];
 if(imagesIn.length){
  const dir=await ensureMediaDir();
  for(const im of imagesIn){
   const name=`${crypto.randomUUID()}.${im.ext}`;
   await fs.writeFile(path.join(dir,name),Buffer.from(im.data,"base64"));
   metaByIndex.push({url:`/api/media/items/${name}`,alt:im.ext==="svg"?"rumus":"gambar"});
  }
 }
 const swap=(t:string)=>{let s=t;metaByIndex.forEach((m,i)=>{s=s.split(`[[IMG:${i}]]`).join(`![${m.alt}](${m.url})`)});return s.replace(/\[\[IMG:\d+\]\]/g,"")};
 if(b.items.length>500)return NextResponse.json({error:"Maksimal 500 soal per satu impor."},{status:400});
 const rejected:{row:number;reason:string}[]=[];
 const valid:{question:string;options:string[];correctIndex:number}[]=[];
 (b.items as RawItem[]).forEach((raw,i)=>{
  const parsed=parseItem(raw||{});
  if(!parsed){rejected.push({row:i+1,reason:"Soal kosong, pilihan tidak 2-5 opsi terisi semua, atau kunci di luar rentang pilihan."});return}
  valid.push(parsed);
 });
 let created=0;
 if(valid.length){
  const last=await db.testItem.aggregate({where:{bankId:bank.id},_max:{order:true}});
  const start=(last._max.order||0)+1;
  const result=await db.testItem.createMany({data:valid.map((v,i)=>({bankId:bank.id,order:start+i,question:swap(v.question),options:v.options.map(swap),correctIndex:v.correctIndex}))});
  created=result.count;
 }
 return NextResponse.json({ok:true,created,rejected});
}
