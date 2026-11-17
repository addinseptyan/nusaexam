"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, FlagIcon, HelpCircleIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import RichText from "@/components/shared/RichText";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Item={id:string;order:number;question:string;options:string[];answer:number|null;marked:boolean};
type Payload={id:string;status:string;startedAt:string;endsAt:string;finishedAt:string|null;score:number|null;serverNow:string;testTitle:string;kind:string;roomLabel:string;items:Item[]};
const LETTERS=["A","B","C","D","E"];
function clock(ms:number){const s=Math.max(0,Math.floor(ms/1000));const m=Math.floor(s/60);const h=Math.floor(m/60);return `${h?h+":":""}${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
export default function RunnerUjian({attemptId,studentName}:{attemptId:string;studentName:string}){
 const {request}=useApi(); const router=useRouter(); const {confirm,dialog}=useConfirm();
 const [data,setData]=useState<Payload|null>(null);
 const [cursor,setCursor]=useState(0);
 const [leftMs,setLeftMs]=useState<number|null>(null);
 const [savedTick,setSavedTick]=useState(0);
 const deadline=useRef(0);
 const statusRef=useRef("MULAI");
 useEffect(()=>{
  fetch(`/api/exam/attempts/${attemptId}`).then(r=>r.json()).then(j=>{if(j?.ok)apply(j.attempt as Payload)}).catch(()=>toast.error("Gagal memuat ujian."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[attemptId]);
 function apply(p:Payload){
  setData(p); statusRef.current=p.status;
  if(p.status==="SELESAI"){setLeftMs(0);return}
  deadline.current=Date.now()+(new Date(p.endsAt).getTime()-new Date(p.serverNow).getTime());
  setLeftMs(Math.max(0,deadline.current-Date.now()));
 }
 useEffect(()=>{
  const t=setInterval(()=>{
   if(statusRef.current!=="MULAI")return;
   const remain=deadline.current-Date.now();
   setLeftMs(remain);
   if(remain<=0)void finish(true);
  },1000);
  return ()=>clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  const h=(e:BeforeUnloadEvent)=>{if(statusRef.current==="MULAI"){e.preventDefault();e.returnValue=""}};
  window.addEventListener("beforeunload",h);
  return ()=>window.removeEventListener("beforeunload",h);
 },[]);
 async function pick(idx:number){
  const item=data?.items[cursor]; if(!item||statusRef.current!=="MULAI")return;
  setData(d=>d?{...d,items:d.items.map((it,i)=>i===cursor?{...it,answer:idx}:it)}:d);
  const res=await request(`/api/exam/attempts/${attemptId}/answers`,"POST",{itemId:item.id,selectedIndex:idx});
  if(res){setSavedTick(t=>t+1);return}
  const refreshed=await fetch(`/api/exam/attempts/${attemptId}`).then(r=>r.json()).catch(()=>null);
  if(refreshed?.ok)apply(refreshed.attempt as Payload);
 }
 async function toggleMark(){
  const item=data?.items[cursor]; if(!item||statusRef.current!=="MULAI")return;
  const next=!item.marked;
  setData(d=>d?{...d,items:d.items.map((it,i)=>i===cursor?{...it,marked:next}:it)}:d);
  const res=await request(`/api/exam/attempts/${attemptId}/answers`,"POST",{itemId:item.id,marked:next});
  if(!res){const refreshed=await fetch(`/api/exam/attempts/${attemptId}`).then(r=>r.json()).catch(()=>null);if(refreshed?.ok)apply(refreshed.attempt as Payload)}
  else setSavedTick(t=>t+1);
 }
 async function finish(auto:boolean){
  if(statusRef.current!=="MULAI")return;
  if(!auto){
   const unanswered=data?.items.filter(i=>i.answer===null).length??0;
   const yes=await confirm("Kumpulkan jawaban",unanswered>0?`Masih ada ${unanswered} soal belum dijawab. Jawaban terkunci permanen dan waktu berhenti.`:"Jawaban terkunci permanen dan waktu berhenti.",{confirmLabel:"Kumpulkan"});
   if(!yes)return;
  }
  statusRef.current="SELESAI";
  const res=await request(`/api/exam/attempts/${attemptId}/finish`,"POST",{});
  if(res){
   setData(d=>d?{...d,status:"SELESAI",score:(res.score as number|null),finishedAt:(res.finishedAt as string|null)}:d);
   setLeftMs(0);
   toast.success(auto?"Waktu habis. Jawaban dikumpulkan otomatis.":"Jawaban terkumpul.");
  }
 }
 if(!data)return <div className="grid min-h-dvh place-items-center bg-slate-50 text-xs text-slate-500">Memuat ujian…</div>;
 if(data.status==="SELESAI")return <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
  <div className="w-full max-w-sm grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center">
   <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><FlagIcon size={22}/></span>
   <h1 className="text-base font-bold text-slate-900">Ujian selesai</h1>
   <p className="text-xs text-slate-500">{data.testTitle} · {studentName}</p>
   <div className="rounded-xl bg-slate-50 p-4"><small className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nilai otomatis</small><strong className="block font-mono text-3xl text-slate-900">{data.score??0}</strong></div>
   <p className="text-[11px] text-slate-400">Nilai akhir ditetapkan guru. Jawaban tidak dapat diubah lagi.</p>
   <Button type="button" onClick={()=>router.push("/ujian")}>Kembali ke daftar ujian</Button>
  </div>
 </div>;
 const item=data.items[cursor];
 const answered=data.items.filter(i=>i.answer!==null).length;
 const danger=(leftMs??0)<5*60*1000;
 return <div className="flex min-h-dvh flex-col bg-slate-100">
  <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
   <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
    <div><strong className="text-sm text-slate-800">{data.testTitle}</strong><span className="block text-[11px] text-slate-500">{studentName} · {data.roomLabel} · berakhir {new Date(data.endsAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} · terjawab {answered}/{data.items.length}</span></div>
    <div className="flex items-center gap-3">
     <span className="hidden items-center gap-1 text-[11px] text-emerald-600 sm:inline-flex" key={savedTick}>{savedTick>0&&<><SaveIcon size={12}/> tersimpan</>}</span>
     <span className={`rounded-lg px-3 py-1.5 font-mono text-sm font-bold ${danger?"bg-rose-50 text-rose-600":"bg-slate-100 text-slate-700"}`}>{clock(leftMs??0)}</span>
     <Button type="button" size="sm" onClick={()=>finish(false)}><FlagIcon size={14}/> Selesai</Button>
    </div>
   </div>
  </header>
  <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-5 lg:grid-cols-[1fr_220px]">
   <section className="grid content-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Soal {cursor+1} dari {data.items.length}</span>
    <div className="text-sm font-semibold text-slate-800"><RichText text={item.question}/></div>
    <div className="grid gap-2">
     {item.options.map((o,idx)=><button type="button" key={idx} onClick={()=>pick(idx)} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${item.answer===idx?"border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_6%,white)] font-semibold text-slate-800":"border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
      <span className={`grid size-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold ${item.answer===idx?"bg-[var(--brand)] text-white":"bg-slate-100 text-slate-500"}`}>{LETTERS[idx]}</span>
      <RichText text={o}/>
     </button>)}
    </div>
    <div className="flex items-center justify-between pt-1">
     <Button type="button" variant={item.marked?"default":"outline"} size="sm" onClick={toggleMark} className={item.marked?"bg-amber-500 hover:bg-amber-600":""}><AlertTriangleIcon size={14}/> {item.marked?"Tandai ragu-ragu":"Ragu-ragu"}</Button>
     <Button type="button" variant="outline" size="sm" disabled={cursor===0} onClick={()=>setCursor(c=>c-1)}><ArrowLeftIcon size={14}/> Sebelumnya</Button>
     <Button type="button" variant="outline" size="sm" disabled={cursor===data.items.length-1} onClick={()=>setCursor(c=>c+1)}>Berikutnya <ArrowRightIcon size={14}/></Button>
    </div>
   </section>
   <aside className="grid content-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigasi soal</span>
    <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
     {data.items.map((it,i)=><button type="button" key={it.id} onClick={()=>setCursor(i)} title={`Soal ${i+1}${it.answer!==null?" · dijawab":""}${it.marked?" · ragu-ragu":""}`} className={`relative grid size-9 place-items-center rounded-md font-mono text-[11px] font-bold ${i===cursor?"bg-[var(--brand)] text-white ring-2 ring-[var(--brand)]/30":it.answer!==null?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
      {i+1}
      {it.answer!==null&&<CheckIcon size={11} strokeWidth={3} className={`absolute bottom-0.5 right-0.5 ${i===cursor?"text-white":"text-emerald-500"}`}/>}
      {it.marked&&<AlertTriangleIcon size={10} className={`absolute right-0.5 top-0.5 ${i===cursor?"text-white":"text-amber-500"}`}/>}
     </button>)}
    </div>
    <div className="grid gap-1 text-[10px] text-slate-500">
     <span className="inline-flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded bg-[var(--brand)] text-[8px] font-bold text-white">1</span> sedang dikerjakan</span>
     <span className="inline-flex items-center gap-1.5"><span className="relative grid size-4 place-items-center rounded bg-emerald-50 text-[8px] font-bold text-emerald-700">2<CheckIcon size={8} strokeWidth={3} className="absolute -bottom-0.5 -right-0.5 text-emerald-500"/></span> sudah dijawab</span>
     <span className="inline-flex items-center gap-1.5"><span className="relative grid size-4 place-items-center rounded bg-slate-100 text-[8px] font-bold text-slate-500">3<AlertTriangleIcon size={8} className="absolute -right-0.5 -top-0.5 text-amber-500"/></span> ditandai ragu-ragu</span>
    </div>
    <p className="text-[10px] leading-relaxed text-slate-400">Jawaban tersimpan otomatis begitu dipilih. Klik gambar untuk memperbesar. Saat waktu habis, jawaban dikumpulkan otomatis.</p>
   </aside>
  </main>
  {dialog}
 </div>;
}
