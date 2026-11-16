"use client";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheetIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
type Row={row:number;name:string;nis:string;nisn:string;status:"ok"|"invalid"|"dup";reason?:string};
type Result={created:number;rejected:{row:number;name:string;reason:string}[]};
const cell=(v:unknown)=>v==null?"":typeof v==="number"?String(Math.trunc(v)):typeof v==="string"?v.trim():String(v).trim();
export default function ImportDialog({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
 const {request}=useApi();
 const fileRef=useRef<HTMLInputElement>(null);
 const [rows,setRows]=useState<Row[]>([]); const [fileName,setFileName]=useState(""); const [busy,setBusy]=useState(false); const [result,setResult]=useState<Result|null>(null);
 const [parseError,setParseError]=useState("");
 const phase=result?"done":rows.length?"preview":"pick";
 function reset(){setRows([]);setFileName("");setResult(null);setParseError("");if(fileRef.current)fileRef.current.value=""}
 function close(){onOpenChange(false);setTimeout(reset,150)}
 function downloadTemplate(){
  const ws=XLSX.utils.aoa_to_sheet([["Nama","NIS","NISN"],["Contoh: Andi Saputra","2201234","0012345678"],["Contoh: Budi Wijaya","",""]]);
  ws["!cols"]=[{wch:28},{wch:14},{wch:14}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Peserta");
  XLSX.writeFile(wb,"template-peserta-nusaexam.xlsx");
 }
 async function parseFile(file:File){
  setParseError("");setResult(null);setRows([]);setFileName(file.name);
  try{
   const buf=await file.arrayBuffer();
   const wb=XLSX.read(buf,{type:"array"});
   const sheet=wb.Sheets[wb.SheetNames[0]];
   if(!sheet){setParseError("File tidak memiliki sheet apapun.");return}
   const matrix=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,raw:true,defval:""});
   let data=matrix.map(r=>r.map(cell));
   const first=data[0]||[];
   const hasHeader=String(first[0]||"").toLocaleLowerCase("id-ID")==="nama";
   if(hasHeader)data=data.slice(1);
   data=data.filter(r=>r.some(c=>c!==""));
   if(!data.length){setParseError("Tidak ada baris data pada file tersebut.");return}
   if(data.length>500){setParseError(`File memuat ${data.length} baris. Maksimal 500 baris per satu impor.`);return}
   const seenKey=new Set<string>();const seenNisn=new Set<string>();
   const parsed:Row[]=data.map((r,i)=>{
    const row=hasHeader?i+2:i+1;
    const name=r[0]||"";const nis=r[1]||"";const nisn=r[2]||"";
    if(!name||name.length>120)return {row,name,nis,nisn,status:"invalid" as const,reason:"Nama wajib diisi (maks. 120 karakter)."};
    if(nis.length>32)return {row,name,nis,nisn,status:"invalid" as const,reason:"NIS maksimal 32 karakter."};
    if(nisn&&!/^\d{10}$/.test(nisn))return {row,name,nis,nisn,status:"invalid" as const,reason:"NISN harus 10 angka."};
    const key=nis?nis.normalize("NFKC").toUpperCase():"";
    if(key&&seenKey.has(key))return {row,name,nis,nisn,status:"dup" as const,reason:"NIS duplikat di dalam file."};
    if(nisn&&seenNisn.has(nisn))return {row,name,nis,nisn,status:"dup" as const,reason:"NISN duplikat di dalam file."};
    if(key)seenKey.add(key);if(nisn)seenNisn.add(nisn);
    return {row,name,nis,nisn,status:"ok" as const};
   });
   setRows(parsed);
  }catch{setParseError("File tidak dapat dibaca. Gunakan format .xlsx, .xls, atau .csv (UTF-8).")}
 }
 const okRows=rows.filter(r=>r.status==="ok");
 async function save(){
  if(busy||!okRows.length)return;setBusy(true);
  const res=await request("/api/students/import","POST",{items:okRows.map(r=>({name:r.name,nis:r.nis,nisn:r.nisn}))});
  setBusy(false);
  if(res){setResult({created:Number(res.created||0),rejected:(res.rejected as Result["rejected"])||[]});}
 }
 return <Dialog open={open} onOpenChange={v=>{if(!v)close()}}>
  <DialogContent className="sm:max-w-lg">
   <DialogHeader><DialogTitle>Impor peserta dari Excel/CSV</DialogTitle><DialogDescription>{phase==="pick"?"Unggah file .xlsx, .xls, atau .csv dengan kolom Nama, NIS, NISN. Baris akan diperiksa dulu sebelum disimpan.":phase==="preview"?"Periksa pratinjau berikut. Hanya baris berstatus Siap yang akan disimpan.":"Ringkasan hasil impor."}</DialogDescription></DialogHeader>
   {phase==="pick"&&<div className="grid gap-3">
    <label className="grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center hover:border-[var(--brand)]/50 hover:bg-slate-50">
     <FileSpreadsheetIcon size={26} className="text-slate-400"/>
     <span className="text-sm font-semibold text-slate-700">Pilih file Excel/CSV</span>
     <span className="text-[11px] text-slate-400">Maks. 500 baris · kolom: Nama, NIS, NISN · baris judul terdeteksi otomatis</span>
     <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)parseFile(f)}}/>
    </label>
    {parseError&&<p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{parseError}</p>}
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">Simpan kolom NIS/NISN sebagai <strong>teks</strong> di Excel agar nol di depan tidak hilang. File .csv harus ber-encoding UTF-8. Data tidak langsung disimpan: Anda melihat pratinjau terlebih dahulu.</div>
    <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}><FileSpreadsheetIcon size={14}/> Unduh template .xlsx</Button>
   </div>}
   {phase==="preview"&&<div className="grid gap-3">
    <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">{okRows.length} siap</span><span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-600">{rows.filter(r=>r.status==="invalid").length} tidak valid</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">{rows.filter(r=>r.status==="dup").length} duplikat</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{fileName}</span></div>
    <div className={tableWrap+" max-h-64 overflow-y-auto rounded-lg border border-slate-200"}><table className={tableCls+" min-w-[480px]"}><thead><tr><th className={thCls}>Baris</th><th className={thCls}>Nama</th><th className={thCls}>NIS / NISN</th><th className={thCls}>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.row}><td className={tdCls+" text-xs"}>{r.row}</td><td className={tdCls+" text-xs"}>{r.name||"—"}</td><td className={tdCls+" text-xs"}>{r.nis||"—"}<span className="block text-slate-400">{r.nisn||"—"}</span></td><td className={tdCls}>{r.status==="ok"?<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Siap</span>:<span className="block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">{r.status==="dup"?"Duplikat":"Tidak valid"}</span>}{r.reason&&<span className="mt-1 block text-[10px] text-slate-400">{r.reason}</span>}</td></tr>)}</tbody></table></div>
    <p className="text-[11px] leading-relaxed text-slate-400">Pemeriksaan duplikat terhadap database dilakukan saat menyimpan. Baris tidak valid dan duplikat di file otomatis dilewati.</p>
   </div>}
   {phase==="done"&&result&&<div className="grid gap-3">
    <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">{result.created} peserta berhasil disimpan.</div>
    {result.rejected.length>0&&<><p className="text-xs font-semibold text-slate-600">{result.rejected.length} baris ditolak server:</p><div className={tableWrap+" max-h-48 overflow-y-auto rounded-lg border border-slate-200"}><table className={tableCls+" min-w-[420px]"}><thead><tr><th className={thCls}>Baris</th><th className={thCls}>Nama</th><th className={thCls}>Alasan</th></tr></thead><tbody>{result.rejected.map(r=><tr key={`${r.row}-${r.name}`}><td className={tdCls+" text-xs"}>{r.row}</td><td className={tdCls+" text-xs"}>{r.name}</td><td className={tdCls+" text-xs"}>{r.reason}</td></tr>)}</tbody></table></div></>}
   </div>}
   <DialogFooter>
    {phase!=="done"?<><Button type="button" variant="outline" onClick={close}>Batal</Button>{phase==="preview"&&<Button type="button" onClick={save} disabled={busy||!okRows.length}><UploadIcon size={15}/> {busy?"Menyimpan…":`Simpan ${okRows.length} baris siap`}</Button>}</>:<Button type="button" onClick={close}>Selesai</Button>}
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
