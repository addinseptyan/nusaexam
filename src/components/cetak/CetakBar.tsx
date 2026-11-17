"use client";
import Link from "next/link";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function CetakBar({label}:{label:string}){
 return <div className="cetak-top sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
  <Link href="/cetak" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeftIcon size={14}/> Pilih dokumen lain</Link>
  <div className="flex items-center gap-2">
   <span className="hidden text-[11px] text-slate-400 sm:block">{label} · gunakan kertas A4, margin bawaan peramban</span>
   <Button type="button" size="sm" onClick={()=>window.print()}><PrinterIcon size={14}/> Cetak / simpan PDF</Button>
  </div>
 </div>;
}
