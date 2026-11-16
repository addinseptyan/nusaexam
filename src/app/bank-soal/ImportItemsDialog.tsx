"use client";
import { useRef, useState, type ReactNode } from "react";
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, VerticalMergeType, WidthType } from "docx";
import { FileTextIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { parseDocx, type ImportParsed } from "@/lib/importDocx";
type Result={created:number;rejected:{row:number;reason:string}[]};
const LETTERS=["A","B","C","D","E"];
const TEMPLATE_GROUPS=50;
const TEMPLATE_OPTIONS=5;
const TOKEN=/\[\[IMG:(\d+)\]\]/g;
function toB64(buf:ArrayBuffer){const u=new Uint8Array(buf);let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s)}
export default function ImportItemsDialog({open,onOpenChange,bankId,bankTitle}:{open:boolean;onOpenChange:(open:boolean)=>void;bankId:string;bankTitle:string}){
 const {request}=useApi();
 const fileRef=useRef<HTMLInputElement>(null);
 const [parsed,setParsed]=useState<ImportParsed|null>(null); const [fileName,setFileName]=useState(""); const [busy,setBusy]=useState(false); const [result,setResult]=useState<Result|null>(null); const [parseError,setParseError]=useState("");
 const rows=parsed?.rows??[];
 const phase=result?"done":rows.length?"preview":"pick";
 function reset(){parsed?.images.forEach(im=>URL.revokeObjectURL(im.url));setParsed(null);setFileName("");setResult(null);setParseError("");if(fileRef.current)fileRef.current.value=""}
 function close(){onOpenChange(false);setTimeout(reset,150)}
 function rich(text:string):ReactNode{
  const out:ReactNode[]=[];let last=0;
  for(const m of text.matchAll(TOKEN)){
   const i=Number(m[1]);const idx=m.index??0;
   if(idx>last)out.push(text.slice(last,idx));
   const url=parsed?.images[i]?.url;
   out.push(url?<img key={`img${idx}`} src={url} alt={`gambar ${i+1}`} className="my-0.5 inline-block max-h-16 rounded border border-slate-200 align-middle"/>:`[gambar ${i+1} hilang]`);
   last=idx+m[0].length;
  }
  if(last<text.length)out.push(text.slice(last));
  return <span className="whitespace-pre-wrap">{out}</span>;
 }
 async function downloadDocxTemplate(){
  const bd={style:BorderStyle.SINGLE,size:4,color:"000000"};
  const mk=(text:string,o:{shade?:boolean;vMerge?:typeof VerticalMergeType.RESTART|typeof VerticalMergeType.CONTINUE;bold?:boolean;width?:number;center?:boolean}={})=>new TableCell({
   width:o.width?{size:o.width,type:WidthType.PERCENTAGE}:undefined,
   shading:o.shade?{type:ShadingType.CLEAR,fill:"FFFF00"}:undefined,
   verticalMerge:o.vMerge,
   children:[new Paragraph({alignment:o.center?AlignmentType.CENTER:undefined,children:[new TextRun({text,bold:o.bold})]})]
  });
  const trs=[new TableRow({tableHeader:true,children:[mk("No",{bold:true,width:6,center:true}),mk("Jenis",{bold:true,width:14}),mk("Isi",{bold:true,width:68}),mk("Jawaban",{bold:true,width:12,center:true})]})];
  for(let n=1;n<=TEMPLATE_GROUPS;n++){
   trs.push(new TableRow({children:[mk(String(n),{vMerge:VerticalMergeType.RESTART,width:6,center:true}),mk("SOAL",{width:14}),mk("",{width:68}),mk("",{shade:true,width:12})]}));
   for(let o=0;o<TEMPLATE_OPTIONS;o++)trs.push(new TableRow({children:[mk("",{vMerge:VerticalMergeType.CONTINUE,width:6}),mk("JAWABAN",{width:14}),mk("",{width:68}),mk("0",{width:12,center:true})]}));
  }
  const doc=new Document({sections:[{children:[
   new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Form Import Soal Pilihan Ganda berdasarkan Topik yang dipilih",bold:true})]}),
   new Paragraph("Jawaban diisi dengan angka 1 untuk jawaban benar, 0 untuk jawaban salah"),
   new Paragraph("Cell yang berwarna kuning tidak perlu diisi"),
   new Paragraph(""),
   new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:bd,bottom:bd,left:bd,right:bd,insideHorizontal:bd,insideVertical:bd},rows:trs})
  ]}]});
  const blob=await Packer.toBlob(doc);
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="template-soal-nusaexam.docx";a.click();
  URL.revokeObjectURL(url);
 }
 async function parseFile(file:File){
  setParseError("");setResult(null);setParsed(null);setFileName(file.name);
  try{
   const res=await parseDocx(await file.arrayBuffer());
   const big=res.images.find(im=>im.blob.size>3*1024*1024);
   if(big){setParseError("Ada gambar melebihi 3 MB. Perkecil dulu gambar pada dokumen Word.");return}
   if(!res.rows.length&&!res.skipped){setParseError("Tabel pada dokumen tidak memuat baris SOAL/JAWABAN sesuai template.");return}
   if(!res.rows.length){setParseError("Semua baris soal masih kosong. Isi kolom Isi pada baris SOAL terlebih dahulu.");return}
   if(res.rows.length>500){setParseError(`File memuat ${res.rows.length} soal. Maksimal 500 soal per satu impor.`);return}
   setParsed(res);
  }catch{setParseError("File tidak dapat dibaca. Gunakan file Word .docx sesuai template.")}
 }
 const okRows=rows.filter(r=>r.status==="ok");
 async function save(){
  if(busy||!okRows.length||!parsed)return;setBusy(true);
  const images=await Promise.all(parsed.images.map(async im=>({mime:im.mime,ext:im.ext,data:toB64(await im.blob.arrayBuffer())})));
  const res=await request("/api/test-items/import","POST",{bankId,items:okRows.map(r=>({question:r.question,options:r.options,correctIndex:r.correctIndex})),images});
  setBusy(false);
  if(res){setResult({created:Number(res.created||0),rejected:(res.rejected as Result["rejected"])||[]});toast.success(`${Number(res.created||0)} soal masuk ke bank ${bankTitle}.`)}
 }
 return <Dialog open={open} onOpenChange={v=>{if(!v)close()}}>
  <DialogContent className="sm:max-w-lg">
   <DialogHeader><DialogTitle>Impor soal ke bank</DialogTitle><DialogDescription>{phase==="pick"?`Unggah file Word untuk bank “${bankTitle}”. Satu baris SOAL diikuti baris-baris JAWABAN; kolom Jawaban diisi 1 untuk kunci dan 0 untuk lainnya. Rumus, simbol, tabel, dan gambar di dalam sel ikut terbaca; rumus matematika dikonversi menjadi gambar SVG agar terbaca rapi saat ujian.`:phase==="preview"?"Periksa pratinjau berikut. Hanya baris berstatus Siap yang disimpan. Baris soal yang kosong otomatis dilewati.":"Ringkasan hasil impor."}</DialogDescription></DialogHeader>
   {phase==="pick"&&<div className="grid gap-3">
    <label className="grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-9 text-center hover:border-[var(--brand)]/50 hover:bg-slate-50">
     <FileTextIcon size={26} className="text-slate-400"/>
     <span className="text-sm font-semibold text-slate-700">Pilih file soal (.docx)</span>
     <span className="text-[11px] text-slate-400">Tabel template: No · Jenis · Isi · Jawaban · maks. 500 soal · gambar maks. 3 MB each</span>
     <Input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)parseFile(f)}}/>
    </label>
    {parseError&&<p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{parseError}</p>}
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="outline" size="sm" onClick={downloadDocxTemplate}><FileTextIcon size={14}/> Template .docx ({TEMPLATE_GROUPS} soal)</Button>
    </div>
   </div>}
   {phase==="preview"&&<div className="grid gap-3">
    <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">{okRows.length} siap</span><span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-600">{rows.filter(r=>r.status==="invalid").length} tidak valid</span>{(parsed?.skipped??0)>0&&<span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">{parsed?.skipped} soal kosong dilewati</span>}{(parsed?.images.length??0)>0&&<span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-600">{parsed?.images.length} gambar</span>}<span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{fileName}</span></div>
    <div className={tableWrap+" max-h-64 overflow-y-auto rounded-lg border border-slate-200"}><table className={tableCls+" min-w-[460px]"}><thead><tr><th className={thCls}>Baris</th><th className={thCls}>Soal</th><th className={thCls+" w-14"}>Kunci</th><th className={thCls+" w-28"}>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.row}><td className={tdCls+" text-xs"}>{r.row}</td><td className={tdCls+" text-xs"}>{rich(r.question)||"—"}<span className="mt-1 block text-[11px] text-slate-500">{r.options.map((o,idx)=><span key={idx} className="block">{LETTERS[idx]}. {rich(o)}</span>)}</span></td><td className={tdCls}>{r.correctIndex>=0?<span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-600">{LETTERS[r.correctIndex]}</span>:"—"}</td><td className={tdCls}>{r.status==="ok"?<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">Siap</span>:<span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">Tidak valid</span>}{r.reason&&<span className="mt-1 block text-[10px] text-slate-400">{r.reason}</span>}</td></tr>)}</tbody></table></div>
   </div>}
   {phase==="done"&&result&&<div className="grid gap-3">
    <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">{result.created} soal tersimpan pada bank {bankTitle}.</div>
    {result.rejected.length>0&&<><p className="text-xs font-semibold text-slate-600">{result.rejected.length} baris ditolak server:</p><div className={tableWrap+" max-h-40 overflow-y-auto rounded-lg border border-slate-200"}><table className={tableCls+" min-w-[360px]"}><thead><tr><th className={thCls}>Baris</th><th className={thCls}>Alasan</th></tr></thead><tbody>{result.rejected.map(r=><tr key={r.row}><td className={tdCls+" text-xs"}>{r.row}</td><td className={tdCls+" text-xs"}>{r.reason}</td></tr>)}</tbody></table></div></>}
   </div>}
   <DialogFooter>
    {phase!=="done"?<><Button type="button" variant="outline" onClick={close}>Batal</Button>{phase==="preview"&&<Button type="button" onClick={save} disabled={busy||!okRows.length}><UploadIcon size={15}/> {busy?"Menyimpan…":`Simpan ${okRows.length} soal`}</Button>}</>:<Button type="button" onClick={close}>Selesai</Button>}
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
