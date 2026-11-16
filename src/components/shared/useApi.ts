"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
export function useApi(){
 const router=useRouter();
 async function request(url:string,method:string,data:unknown):Promise<Record<string,unknown>|null>{
  try{
   const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const j=await r.json().catch(()=>({}));
   if(!r.ok){toast.error(j.error||"Proses gagal. Periksa kembali isian Anda.");return null}
   router.refresh();
   return j as Record<string,unknown>;
  }catch{toast.error("Tidak dapat menghubungi server.");return null}
 }
 return {request};
}
