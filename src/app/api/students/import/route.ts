import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseStudentFields } from "@/lib/students";
type Item={name?:unknown;nis?:unknown;nisn?:unknown};
export async function POST(request:Request){
 if(!isSameOrigin(request))return NextResponse.json({error:"Permintaan ditolak."},{status:403});
 if(!(await getCurrentUser()))return NextResponse.json({error:"Silakan login kembali."},{status:401});
 let b:{items?:unknown};
 try{b=await request.json()}catch{return NextResponse.json({error:"Data tidak valid."},{status:400})}
 if(!Array.isArray(b.items)||!b.items.length)return NextResponse.json({error:"Tidak ada baris yang dapat diimpor."},{status:400});
 if(b.items.length>500)return NextResponse.json({error:"Maksimal 500 baris per satu impor."},{status:400});
 const rejected:{row:number;name:string;reason:string}[]=[];
 const parsed:{row:number;name:string;nis:string|null;nisKey:string|null;nisn:string|null}[]=[];
 const seenKey=new Set<string>(); const seenNisn=new Set<string>();
 (b.items as Item[]).forEach((raw,i)=>{
  const row=i+1;
  const label=typeof raw?.name==="string"&&raw.name.trim()?raw.name.trim():`(baris ${row})`;
  const f=parseStudentFields(raw||{});
  if(!f){rejected.push({row,name:label,reason:"Format tidak valid: nama wajib diisi, NIS maksimal 32 karakter, NISN 10 angka jika diisi."});return}
  if(f.nisKey&&seenKey.has(f.nisKey)){rejected.push({row,name:f.name,reason:"NIS duplikat di dalam file."});return}
  if(f.nisn&&seenNisn.has(f.nisn)){rejected.push({row,name:f.name,reason:"NISN duplikat di dalam file."});return}
  if(f.nisKey)seenKey.add(f.nisKey);
  if(f.nisn)seenNisn.add(f.nisn);
  parsed.push({row,...f});
 });
 const keys=parsed.map(p=>p.nisKey).filter((x):x is string=>!!x);
 const nisns=parsed.map(p=>p.nisn).filter((x):x is string=>!!x);
 const existing=await db.student.findMany({where:{OR:[...(keys.length?[{nisKey:{in:keys}}]:[]),...(nisns.length?[{nisn:{in:nisns}}]:[])]}});
 const usedKey=new Set(existing.map(e=>e.nisKey).filter((x):x is string=>!!x));
 const usedNisn=new Set(existing.map(e=>e.nisn).filter((x):x is string=>!!x));
 const fresh=parsed.filter(p=>{
  if(p.nisKey&&usedKey.has(p.nisKey)){rejected.push({row:p.row,name:p.name,reason:"NIS sudah terdaftar di database."});return false}
  if(p.nisn&&usedNisn.has(p.nisn)){rejected.push({row:p.row,name:p.name,reason:"NISN sudah terdaftar di database."});return false}
  return true;
 });
 let created=0;
 if(fresh.length){
  try{
   const result=await db.student.createMany({data:fresh.map(p=>({name:p.name,nis:p.nis,nisKey:p.nisKey,nisn:p.nisn}))});
   created=result.count;
  }catch(e){
   if(!(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")){console.error("Gagal impor peserta:",e);return NextResponse.json({error:"Tidak dapat menyimpan hasil impor."},{status:500})}
   for(const p of fresh){
    try{await db.student.create({data:{name:p.name,nis:p.nis,nisKey:p.nisKey,nisn:p.nisn}});created++}
    catch(err){if(err instanceof Prisma.PrismaClientKnownRequestError&&err.code==="P2002"){rejected.push({row:p.row,name:p.name,reason:"NIS atau NISN bentrok dengan data lain saat disimpan."});continue}throw err}
   }
  }
 }
 rejected.sort((a,b)=>a.row-b.row);
 return NextResponse.json({ok:true,created,rejected});
}
