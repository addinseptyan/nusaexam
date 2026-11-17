"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/shared/SelectField";
const DOCS=[
 {value:"peserta",label:"Daftar peserta pelaksanaan",needs:"execution"},
 {value:"kartu",label:"Kartu login peserta (periode pelaksanaan)",needs:"execution"},
 {value:"absensi",label:"Daftar hadir peserta",needs:"execution"},
 {value:"berita-acara",label:"Berita acara pelaksanaan",needs:"execution"},
 {value:"jadwal",label:"Jadwal pelaksanaan per periode",needs:"period"},
 {value:"pengumuman",label:"Pengumuman & tata tertib periode",needs:"period"}
] as const;
export default function CetakPicker({executions,periods}:{executions:{id:string;label:string}[];periods:{id:string;label:string}[]}){
 const router=useRouter();
 const [doc,setDoc]=useState<string>("peserta");
 const [executionId,setExecutionId]=useState(executions[0]?.id??"");
 const [periodId,setPeriodId]=useState(periods[0]?.id??"");
 const active=DOCS.find(d=>d.value===doc);
 const ready=active?.needs==="execution"?!!executionId:!!periodId;
 function open(){
  if(!ready||!active)return;
  const q=active.needs==="execution"?`executionId=${executionId}`:`periodId=${periodId}`;
  router.push(`/cetak/${active.value}?${q}`);
 }
 return <div className="grid max-w-2xl gap-4">
  <SelectField label="Jenis dokumen" value={doc} onValueChange={(v:string)=>setDoc(v)} options={DOCS.map(d=>({value:d.value,label:d.label}))}/>
  {active?.needs==="execution"?<SelectField label="Pelaksanaan" value={executionId} onValueChange={(v:string)=>setExecutionId(v)} options={executions.map(e=>({value:e.id,label:e.label}))} placeholder="Pilih pelaksanaan…"/>:<SelectField label="Periode ujian" value={periodId} onValueChange={(v:string)=>setPeriodId(v)} options={periods.map(e=>({value:e.id,label:e.label}))} placeholder="Pilih periode…"/>}
  <div className="flex justify-end"><Button type="button" disabled={!ready} onClick={open}><ExternalLinkIcon size={15}/> Buka tampilan cetak</Button></div>
  <p className="text-[11px] leading-relaxed text-slate-400">Dokumen terbuka sebagai halaman bersih tanpa menu operator. Tekan tombol cetak di atasnya (atau Ctrl+P); kepala dokumen mengikuti nama sekolah dan deskripsi pada halaman Pengaturan.</p>
 </div>;
}
