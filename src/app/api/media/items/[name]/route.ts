import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { IMG_MIME, mediaItemsDir } from "@/lib/media";
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){
 const {name}=await params;
 const m=/^([a-f0-9-]{36})\.([a-z]+)$/i.exec(name||"");
 if(!m||!IMG_MIME[m[2].toLowerCase()])return NextResponse.json({error:"Berkas tidak ditemukan."},{status:404});
 const file=path.join(mediaItemsDir(),name);
 const data=await fs.readFile(file).catch(()=>null);
 if(!data)return NextResponse.json({error:"Berkas tidak ditemukan."},{status:404});
 return new NextResponse(new Uint8Array(data),{headers:{
  "content-type":IMG_MIME[m[2].toLowerCase()],
  "cache-control":"public, max-age=31536000, immutable",
  "content-security-policy":"default-src 'none'; sandbox"
 }});
}
