"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClockIcon, LogOutIcon, MapPinIcon, TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Row={executionId:string;attemptId:string|null;state:"BELUM"|"AKTIF"|"SELESAI"|"LEWAT";testTitle:string;kind:string;roomLabel:string;startAt:string;endAt:string;endsAt:string;durationMinutes:number;score:number|null};
const KIND:Record<string,string>={REGULER:"Reguler",SUSULAN:"Susulan",REMIDI:"Remidi"};
const STATE:Record<string,{label:string;cls:string}>={BELUM:{label:"Belum dimulai",cls:"bg-slate-100 text-slate-600"},AKTIF:{label:"Sedang berlangsung",cls:"bg-emerald-50 text-emerald-600"},SELESAI:{label:"Selesai",cls:"bg-sky-50 text-sky-600"},LEWAT:{label:"Tidak dihadiri",cls:"bg-rose-50 text-rose-600"}};
const fmt=(s:string)=>new Date(s).toLocaleString("id-ID",{weekday:"short",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
export default function DaftarUjian({studentName,periodName,appName,schoolName}:{studentName:string;periodName:string;appName:string;schoolName:string}){
 const {request}=useApi(); const router=useRouter(); const {confirm,dialog}=useConfirm();
 const [rows,setRows]=useState<Row[]|null>(null); const [busyId,setBusyId]=useState("");
 const load=useCallback(()=>{fetch("/api/exam/tests").then(r=>r.json()).then(j=>{if(j?.ok)setRows(j.rows as Row[])}).catch(()=>setRows([]))},[]);
 useEffect(()=>{load()},[load]);
 async function start(row:Row){
  if(busyId)return; setBusyId(row.executionId);
  const res=await request("/api/exam/attempts","POST",{executionId:row.executionId});
  setBusyId("");
  const attempt=res?.attempt as {id:string}|undefined;
  if(attempt)router.push(`/ujian/${attempt.id}`);
 }
 async function logout(){
  const yes=await confirm("Keluar dari akun ujian","Sesi login ditutup. Jawaban yang sudah tersimpan tetap aman.",{confirmLabel:"Keluar"});
  if(!yes)return;
  await request("/api/exam/logout","POST",{});
  router.push("/ujian/login");
 }
 return <div className="min-h-dvh bg-slate-50">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
   <div><strong className="text-sm text-slate-800">{appName}</strong><span className="block text-[11px] text-slate-500">{studentName} · {periodName}</span></div>
   <Button type="button" variant="outline" size="sm" onClick={logout}><LogOutIcon size={14}/> Keluar</Button>
  </div></header>
  <main className="mx-auto grid max-w-3xl gap-3 px-4 py-6">
   <div><h1 className="text-lg font-bold tracking-tight text-slate-900">Daftar ujian saya</h1><p className="text-xs text-slate-500">{schoolName} · hanya ujian yang ditugaskan kepada Anda yang tampil di sini.</p></div>
   {rows===null?<p className="text-xs text-slate-500">Memuat daftar ujian…</p>:rows.length===0?<div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">Belum ada ujian yang ditugaskan kepada Anda pada periode ini.</div>:rows.map(r=>{
    const st=STATE[r.state];
    return <div key={r.executionId} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4">
     <div className="flex flex-wrap items-center gap-2">
      <strong className="text-sm text-slate-800">{r.testTitle}</strong>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{KIND[r.kind]??r.kind}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
      {r.state==="SELESAI"&&r.score!==null&&<span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600">Nilai {r.score}</span>}
     </div>
     <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-1"><CalendarClockIcon size={12}/> {fmt(r.startAt)} – {fmt(r.endAt)}</span>
      <span className="inline-flex items-center gap-1"><TimerIcon size={12}/> {r.durationMinutes} menit dari jam mulai · berakhir {new Date(r.endsAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</span>
      <span className="inline-flex items-center gap-1"><MapPinIcon size={12}/> {r.roomLabel}</span>
     </div>
     <div className="flex justify-end">
      {r.state==="AKTIF"&&<Button type="button" size="sm" disabled={!!busyId} onClick={()=>start(r)}>{busyId===r.executionId?"Membuka…":r.attemptId?"Lanjutkan ujian":"Masuk ujian"}</Button>}
      {r.state==="BELUM"&&<span className="text-[11px] text-slate-400">Tombol masuk aktif saat jadwal dimulai.</span>}
      {r.state==="LEWAT"&&<span className="text-[11px] text-rose-500">Waktu pengerjaan telah berakhir (dihitung dari jam mulai terjadwal). Hubungi operator bila Anda memiliki izin susulan.</span>}
      {r.state==="SELESAI"&&<span className="text-[11px] text-slate-400">Jawaban sudah terkunci.</span>}
     </div>
    </div>;
   })}
  </main>
  {dialog}
 </div>;
}
