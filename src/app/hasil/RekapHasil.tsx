"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangleIcon, ClipboardListIcon } from "lucide-react";
import { SelectField } from "@/components/shared/SelectField";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { EmptyState } from "@/components/shared/EmptyState";
type Row={studentId:string;name:string;className:string;reguler:number|null;susulan:number|null;remidi:number|null;main:number|null;flag:boolean};
export default function RekapHasil({options}:{options:{value:string;label:string}[]}){
 const [testId,setTestId]=useState(options[0]?.value??"");
 const [rows,setRows]=useState<Row[]|null>(null);
 const load=useCallback(()=>{
  if(!testId)return;
  fetch(`/api/hasil/recap?testId=${testId}`).then(r=>r.json()).then(j=>{if(j?.ok)setRows(j.rows as Row[])}).catch(()=>setRows([]));
 },[testId]);
 useEffect(()=>{setRows(null);load()},[load]);
 const sel=(v:number|null)=>v===null?<span className="text-slate-300">—</span>:<span className="font-mono text-xs font-bold text-slate-800">{v}</span>;
 return <div className="grid gap-4">
  <div className="w-full max-w-xl"><SelectField label="Tes" value={testId} onValueChange={(v:string)=>setTestId(v)} options={options} placeholder="Pilih tes…"/></div>
  {!testId?<EmptyState icon={ClipboardListIcon} title="Belum ada tes" description="Buat tes pada halaman Bank soal & tes terlebih dahulu."/>:rows===null?<p className="text-xs text-slate-500">Memuat rekap…</p>:rows.length===0?<EmptyState icon={ClipboardListIcon} title="Belum ada peserta tertugaskan" description="Tugaskan peserta pada pelaksanaan tes ini untuk melihat rekap."/>:<div className={tableWrap}><table className={tableCls}>
   <thead><tr><th className={thCls}>Peserta</th><th className={thCls+" w-28"}>Kelas</th><th className={thCls+" w-24 text-right"}>Reguler</th><th className={thCls+" w-24 text-right"}>Susulan</th><th className={thCls+" w-24 text-right"}>Remidi</th><th className={thCls+" w-28 text-right"}>Hasil utama</th><th className={thCls+" w-40"}>Catatan</th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.studentId} className="hover:bg-slate-50/60">
    <td className={tdCls+" text-xs font-semibold text-slate-800"}>{r.name}</td>
    <td className={tdCls+" text-xs"}>{r.className}</td>
    <td className={tdCls+" text-right"}>{sel(r.reguler)}</td>
    <td className={tdCls+" text-right"}>{sel(r.susulan)}</td>
    <td className={tdCls+" text-right"}>{sel(r.remidi)}</td>
    <td className={tdCls+" text-right"}>{sel(r.main)}</td>
    <td className={tdCls}>{r.flag?<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600"><AlertTriangleIcon size={11}/> nilai valid ganda</span>:r.main===null?<span className="text-[10px] font-semibold text-rose-500">tidak ada nilai (absen)</span>:<span className="text-[10px] text-slate-400">—</span>}</td>
   </tr>)}</tbody>
  </table></div>}
  <p className="text-[11px] leading-relaxed text-slate-400">Hasil utama = nilai reguler bila ada, selain itu nilai susulan; remidi tidak pernah ikut gabungan dan ditampilkan terpisah. Sel kosong berarti peserta absen (bukan nol). Nilai akhir tetap ditetapkan guru.</p>
 </div>;
}
