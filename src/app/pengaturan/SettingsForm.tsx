"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PaletteIcon, RotateCcwIcon, SaveIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
type Values={appName:string;schoolName:string;description:string;primaryColor:string;sidebarColor:string};
const defaults={primaryColor:"#214ed8",sidebarColor:"#122a3d"};
export default function SettingsForm({initial}:{initial:Values}){
 const router=useRouter();
 const [v,setV]=useState(initial); const [busy,setBusy]=useState(false);
 function set(k:keyof Values,value:string){setV(x=>({...x,[k]:value}))}
 async function save(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);try{const r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(v)});const j=await r.json().catch(()=>({}));if(!r.ok){toast.error(j.error||"Gagal menyimpan pengaturan.");return}router.refresh();toast.success("Pengaturan berhasil disimpan.")}catch{toast.error("Tidak dapat menghubungi server.")}finally{setBusy(false)}}
 return <form className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={save}>
  <Card title="Identitas aplikasi" description="Nama dan identitas sekolah tampil di sidebar, halaman login, dan dokumen." bodyClassName="grid gap-4 p-5">
   <div className="grid gap-4 sm:grid-cols-2">
    <Field label="Nama aplikasi"><Input value={v.appName} required maxLength={60} onChange={e=>set("appName",e.target.value)}/></Field>
    <Field label="Nama sekolah"><Input value={v.schoolName} required maxLength={120} onChange={e=>set("schoolName",e.target.value)}/></Field>
   </div>
   <Field label="Deskripsi singkat" hint="Maks. 160 karakter"><Input value={v.description} maxLength={160} onChange={e=>set("description",e.target.value)}/></Field>
   <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
    <p className="text-[11px] leading-relaxed text-slate-400">Warna utama dipakai untuk tombol dan elemen aktif; warna sidebar untuk panel navigasi.</p>
    <Button type="submit" disabled={busy}><SaveIcon size={15}/> {busy?"Menyimpan…":"Simpan pengaturan"}</Button>
   </div>
  </Card>
  <Card title="Warna & pratinjau" description="Perubahan terlihat setelah disimpan." bodyClassName="grid gap-4 p-5">
   <div className="grid grid-cols-2 gap-3">
    <Field label="Warna utama"><span className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2"><input type="color" aria-label="Warna utama" className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" value={v.primaryColor} onChange={e=>set("primaryColor",e.target.value)}/><span className="text-xs font-semibold uppercase text-slate-500">{v.primaryColor}</span></span></Field>
    <Field label="Warna sidebar"><span className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2"><input type="color" aria-label="Warna sidebar" className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" value={v.sidebarColor} onChange={e=>set("sidebarColor",e.target.value)}/><span className="text-xs font-semibold uppercase text-slate-500">{v.sidebarColor}</span></span></Field>
   </div>
   <div className="overflow-hidden rounded-xl border border-slate-200">
    <div className="flex items-center gap-2 p-3" style={{background:v.sidebarColor}}><span className="grid size-7 place-items-center rounded-lg bg-white/15 text-white"><SparklesIcon size={14}/></span><span className="min-w-0"><strong className="block truncate text-xs text-white">{v.appName}</strong><small className="block truncate text-[10px] text-white/60">{v.description}</small></span></div>
    <div className="grid gap-2 bg-white p-3"><span className="rounded-md px-3 py-1.5 text-center text-xs font-semibold text-white" style={{background:v.primaryColor}}>Tombol utama</span><span className="text-[11px] text-slate-400">{v.schoolName}</span></div>
   </div>
   <div className="flex items-center justify-between gap-2">
    <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><PaletteIcon size={13}/> Pilih warna gelap agar teks putih terbaca.</p>
    <Button type="button" variant="outline" size="sm" onClick={()=>setV(x=>({...x,...defaults}))}><RotateCcwIcon size={14}/> Warna bawaan</Button>
   </div>
  </Card>
 </form>;
}
