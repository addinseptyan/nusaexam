"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
export function useApi(){
 const router=useRouter();
 async function request(url:string,method:string,data:unknown){
  try{
   const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const j=await r.json().catch(()=>({}));
   if(!r.ok){toast.error(j.error||"Proses gagal. Periksa kembali isian Anda.");return false}
   router.refresh();
   return true;
  }catch{toast.error("Tidak dapat menghubungi server.");return false}
 }
 return {request};
}
