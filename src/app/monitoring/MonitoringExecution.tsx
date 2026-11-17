"use client";
import { useCallback, useEffect, useState } from "react";
import { ActivityIcon, RefreshCwIcon } from "lucide-react";
import { SelectField } from "@/components/shared/SelectField";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { EmptyState } from "@/components/shared/EmptyState";
type Row={studentId:string;name:string;className:string;status:"BELUM"|"BERLANGSUNG"|"SELESAI"|"ABSEN";answered:number;total:number;marked:number;sisaMenit:number;score:number|null;finishedAt:string|null};
type Data={serverNow:string;execution:{title:string;kind:string;roomLabel:string;startAt:string;endsAt:string;durationMinutes:number;periodName:string};summary:{total:number;belum:number;berlangsung:number;selesai:number;absen:number;rata:number|null};rows:Row[]};
const BADGE:Record<string,string>={BELUM:"bg-slate-100 text-slate-600",BERLANGSUNG:"bg-emerald-50 text-emerald-600",SELESAI:"bg-sky-50 text-sky-600",ABSEN:"bg-rose-50 text-rose-600"};
const LABEL:Record<string,string>={BELUM:"Belum masuk",BERLANGSUNG:"Mengerjakan",SELESAI:"Selesai",ABSEN:"Tidak hadir"};
export default function MonitoringExecution({options}:{options:{id:string;label:string}[]}){
 const [execId,setExecId]=useState(options[0]?.id??"");
 const [data,setData]=useState<Data|null>(null);
 const [tick,setTick]=useState(0);
 const load=useCallback(()=>{
  if(!execId)return;
  if(typeof document!=="undefined"&&document.hidden)return;
  fetch(`/api/monitoring/execution?executionId=${execId}`).then(r=>r.json()).then(j=>{if(j?.ok){setData(j as Data);setTick(t=>t+1)}}).catch(()=>{});
 },[execId]);
 useEffect(()=>{setData(null);load();const t=setInterval(load,8000);return()=>clearInterval(t)},[load]);
 return <div className="grid gap-4">
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div className="w-full max-w-xl"><SelectField label="Pelaksanaan" value={execId} onValueChange={(v:string)=>setExecId(v)} options={options.map(o=>({value:o.id,label:o.label}))} placeholder="Pilih pelaksanaan…"/></div>
   <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500"><RefreshCwIcon size={12}/> memuat otomatis · pembaruan #{tick}</span>
  </div>
  {!execId?<EmptyState icon={ActivityIcon} title="Belum ada pelaksanaan" description="Buat pelaksanaan pada halaman Pelaksanaan tes terlebih dahulu."/>:!data?<p className="text-xs text-slate-500">Memuat data monitoring…</p>:<>
   <div className="stat-grid five">
    <div className="stat-card"><div><small>PESERTA</small><strong>{data.summary.total}</strong><span>{data.execution.periodName}</span></div></div>
    <div className="stat-card"><div><small>BELUM MASUK</small><strong>{data.summary.belum}</strong><span>menunggu masuk</span></div></div>
    <div className="stat-card"><div><small>MENGERJAKAN</small><strong>{data.summary.berlangsung}</strong><span>sedang berlangsung</span></div></div>
    <div className="stat-card"><div><small>SELESAI</small><strong>{data.summary.selesai}</strong><span>rata-rata {data.summary.rata??"—"}</span></div></div>
    <div className="stat-card"><div><small>TIDAK HADIR</small><strong>{data.summary.absen}</strong><span>lewat waktu mulai</span></div></div>
   </div>
   <div className={tableWrap}><table className={tableCls}>
    <thead><tr><th className={thCls}>Peserta</th><th className={thCls+" w-28"}>Kelas</th><th className={thCls+" w-32"}>Status</th><th className={thCls+" w-40"}>Progres</th><th className={thCls+" w-24"}>Ragu-ragu</th><th className={thCls+" w-24"}>Sisa</th><th className={thCls+" w-20 text-right"}>Nilai</th></tr></thead>
    <tbody>{data.rows.map(r=><tr key={r.studentId} className="hover:bg-slate-50/60">
     <td className={tdCls+" text-xs font-semibold text-slate-800"}>{r.name}</td>
     <td className={tdCls+" text-xs"}>{r.className}</td>
     <td className={tdCls}><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE[r.status]}`}>{LABEL[r.status]}</span></td>
     <td className={tdCls}>{r.total>0?<div className="grid gap-1"><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand)]" style={{width:`${Math.round((r.answered/r.total)*100)}%`}}/></div><span className="text-[10px] text-slate-500">{r.answered}/{r.total} soal</span></div>:"—"}</td>
     <td className={tdCls+" text-xs"}>{r.marked>0?<span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-600">{r.marked}</span>:"—"}</td>
     <td className={tdCls+" text-xs"}>{r.status==="BERLANGSUNG"?<span className={`font-mono font-bold ${r.sisaMenit<=5?"text-rose-600":"text-slate-600"}`}>{r.sisaMenit} mnt</span>:"—"}</td>
     <td className={tdCls+" text-right"}>{r.score!==null?<span className="font-mono text-xs font-bold text-slate-800">{r.score}</span>:"—"}</td>
    </tr>)}</tbody>
   </table></div>
   <p className="text-[11px] text-slate-400">Berakhir {new Date(data.execution.endsAt).toLocaleString("id-ID")} · durasi {data.execution.durationMinutes} menit dari jam mulai terjadwal · peserta telat hanya mendapat sisa waktu.</p>
  </>}
 </div>;
}
