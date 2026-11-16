"use client";
import { useMemo, useState } from "react";
import { InboxIcon, KeyRoundIcon, PrinterIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { SelectField } from "@/components/shared/SelectField";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowMenu } from "@/components/shared/RowMenu";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Period={id:string;name:string;academicYearId:string;academicYearLabel:string;archived:boolean};
type Account={id:string;examPeriodId:string;studentId:string;studentName:string;participantNumber:string;username:string};
type Student={id:string;name:string;nis:string;archived:boolean};
type Generated={studentName:string;participantNumber:string;username:string;password:string};
export default function AccountManager({periods,accounts,students,enrollments}:{periods:Period[];accounts:Account[];students:Student[];enrollments:{studentId:string;academicYearId:string}[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const usablePeriods=periods.filter(p=>!p.archived);
 const [periodId,setPeriodId]=useState(usablePeriods[0]?.id||periods[0]?.id||"");
 const period=periods.find(p=>p.id===periodId);
 const periodAccounts=useMemo(()=>accounts.filter(a=>a.examPeriodId===periodId),[accounts,periodId]);
 const [genOpen,setGenOpen]=useState(false); const [genSearch,setGenSearch]=useState(""); const [selected,setSelected]=useState<string[]>([]); const [generated,setGenerated]=useState<Generated[]|null>(null); const [genSkipped,setGenSkipped]=useState<string[]>([]);
 const [editTarget,setEditTarget]=useState<Account|null>(null); const [editNumber,setEditNumber]=useState(""); const [editUsername,setEditUsername]=useState("");
 const [resetInfo,setResetInfo]=useState<{name:string;password:string}|null>(null);
 const [busy,setBusy]=useState(false);
 const candidates=useMemo(()=>{
  if(!period)return [];
  const enrolled=new Set(enrollments.filter(e=>e.academicYearId===period.academicYearId).map(e=>e.studentId));
  const hasAccount=new Set(periodAccounts.map(a=>a.studentId));
  const q=genSearch.trim().toLocaleLowerCase("id-ID");
  return students.filter(s=>!s.archived&&enrolled.has(s.id)&&!hasAccount.has(s.id)&&(!q||`${s.name} ${s.nis}`.toLocaleLowerCase("id-ID").includes(q)));
 },[students,enrollments,period,periodAccounts,genSearch]);
 const allChecked=candidates.length>0&&candidates.every(c=>selected.includes(c.id));
 function openGen(){setGenerated(null);setGenSkipped([]);setGenSearch("");setSelected(candidatesDefault());setGenOpen(true)}
 function candidatesDefault(){
  if(!period)return [];
  const enrolled=new Set(enrollments.filter(e=>e.academicYearId===period.academicYearId).map(e=>e.studentId));
  const hasAccount=new Set(periodAccounts.map(a=>a.studentId));
  return students.filter(s=>!s.archived&&enrolled.has(s.id)&&!hasAccount.has(s.id)).map(s=>s.id);
 }
 function toggleOne(id:string){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 function toggleAll(){setSelected(allChecked?selected.filter(id=>!candidates.some(c=>c.id===id)):[...new Set([...selected,...candidates.map(c=>c.id)])])}
 async function generate(){
  if(busy||!selected.length||!period)return;setBusy(true);
  const res=await request("/api/exam-accounts","POST",{examPeriodId:period.id,studentIds:selected});
  setBusy(false);
  if(res){setGenerated((res.accounts as Generated[])||[]);setGenSkipped((res.skipped as string[])||[]);toast.success(`${((res.accounts as Generated[])||[]).length} akun dibuat. Password hanya tampil sekali di layar ini.`)}
 }
 function openEdit(a:Account){setEditTarget(a);setEditNumber(a.participantNumber);setEditUsername(a.username)}
 async function saveEdit(){
  if(busy||!editTarget)return;setBusy(true);
  const ok=await request("/api/exam-accounts","PATCH",{id:editTarget.id,action:"edit",participantNumber:editNumber,username:editUsername});
  setBusy(false);if(ok){setEditTarget(null);toast.success("Akun berhasil diperbarui.")}
 }
 async function resetPassword(a:Account){
  const yes=await confirm("Reset password",`Password lama “${a.studentName}” tidak akan berlaku lagi. Password baru hanya ditampilkan sekali setelah reset.`,{confirmLabel:"Reset password"});
  if(!yes)return;
  const res=await request("/api/exam-accounts","PATCH",{id:a.id,action:"reset-password"});
  if(res){setResetInfo({name:a.studentName,password:String(res.password||"")});}
 }
 async function remove(a:Account){
  const yes=await confirm("Hapus akun",`Akun “${a.studentName}” (${a.participantNumber}) pada periode ini akan dihapus permanen.`,{confirmLabel:"Hapus akun",destructive:true});
  if(!yes)return;
  if(await request("/api/exam-accounts","DELETE",{id:a.id}))toast.success("Akun berhasil dihapus.");
 }
 return <>
  <div className="mb-4 flex flex-wrap items-center gap-2">
   <SelectField aria-label="Pilih periode" className="min-w-[240px] flex-1" value={periodId} onValueChange={setPeriodId} options={periods.map(p=>({value:p.id,label:`${p.name} (${p.academicYearLabel})${p.archived?" · diarsipkan":""}`}))} placeholder="Pilih periode"/>
   <Button onClick={openGen} disabled={!period}><SparklesIcon size={16}/> Generate akun</Button>
  </div>
  <Card title={period?`Akun periode ${period.name}`:"Akun periode"} description={`${periodAccounts.length} akun pada periode ini`} bodyClassName="p-0">
   {periodAccounts.length===0?<EmptyState icon={InboxIcon} title="Belum ada akun pada periode ini" description={period?"Generate akun untuk peserta yang terdaftar pada tahun ajaran periode ini. Nomor peserta dan username dibuat otomatis; password hanya tampil sekali.":"Pilih periode ujian terlebih dahulu."}/>:<div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>No. peserta</th><th className={thCls}>Username</th><th className={thCls}>Peserta</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{periodAccounts.map(a=><tr key={a.id} className="hover:bg-slate-50/60"><td className={tdCls}><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">{a.participantNumber}</span></td><td className={tdCls+" font-mono text-xs"}>{a.username}</td><td className={tdCls+" text-sm font-semibold text-slate-800"}>{a.studentName}</td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={()=>openEdit(a)} onReset={()=>resetPassword(a)} onDelete={()=>remove(a)}/></div></td></tr>)}</tbody></table></div>}
   <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-400">Password tidak pernah disimpan sebagai teks polos dan tidak dapat dilihat lagi setelah layar generasi/reset ditutup. Jika hilang, gunakan Reset password pada baris akun.</p>
  </Card>
  <Dialog open={genOpen} onOpenChange={v=>{if(!v){setGenOpen(false);setGenerated(null)}}}>
   <DialogContent className="sm:max-w-lg">
    <DialogHeader><DialogTitle>Generate akun periode</DialogTitle><DialogDescription>{generated?`${generated.length} akun baru dibuat pada periode ${period?.name}. Simpan atau cetak sekarang — password tidak akan tampil lagi.`:`Pilih peserta yang akan dibuatkan akun pada periode ${period?.name||""}. Nomor peserta memakai format YYMM-nomor urut (mis. ${new Date().toISOString().slice(2,4)}${String(new Date().getMonth()+1).padStart(2,"0")}-0001) dan username otomatis mengikuti nomor.`}</DialogDescription></DialogHeader>
    {!generated?<div className="grid gap-3">
     <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-100 p-2"><div className="relative"><SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="h-8 pl-8 text-xs" placeholder="Cari nama atau NIS…" value={genSearch} onChange={e=>setGenSearch(e.target.value)}/></div></div>
      <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-600"><Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={!candidates.length}/> Pilih semua hasil ({candidates.length})</label>
      <div className="max-h-56 overflow-y-auto p-1">
       {candidates.length===0?<p className="px-3 py-6 text-center text-xs text-slate-400">Tidak ada kandidat: semua peserta terdaftar pada tahun ajaran periode ini sudah memiliki akun, atau belum ada penempatan kelas.</p>:candidates.map(c=><label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-xs hover:bg-slate-50"><Checkbox checked={selected.includes(c.id)} onCheckedChange={()=>toggleOne(c.id)}/><span className="min-w-0"><span className="block truncate font-semibold text-slate-700">{c.name}</span>{c.nis&&<span className="block truncate text-[11px] text-slate-400">{c.nis}</span>}</span></label>)}
      </div>
     </div>
     <p className="text-[11px] leading-relaxed text-slate-400">Kandidat diambil dari peserta aktif yang memiliki penempatan kelas pada tahun ajaran periode ini dan belum punya akun di periode ini.</p>
    </div>:<div className="print-area grid gap-3">
     <div className="text-xs font-semibold text-slate-700">Kredensial akun peserta — {period?.name} ({period?.academicYearLabel})</div>
     <div className={tableWrap+" max-h-64 overflow-y-auto rounded-lg border border-slate-200"}><table className={tableCls+" min-w-[460px]"}><thead><tr><th className={thCls}>No. peserta</th><th className={thCls}>Username</th><th className={thCls}>Password</th><th className={thCls}>Nama</th></tr></thead><tbody>{generated.map(g=><tr key={g.participantNumber}><td className={tdCls+" font-mono text-xs font-bold"}>{g.participantNumber}</td><td className={tdCls+" font-mono text-xs"}>{g.username}</td><td className={tdCls+" font-mono text-xs font-bold text-emerald-700"}>{g.password}</td><td className={tdCls+" text-xs"}>{g.studentName}</td></tr>)}</tbody></table></div>
     {genSkipped.length>0&&<p className="text-[11px] text-slate-500">Dilewati ({genSkipped.length}): {genSkipped.join(", ")}</p>}
     <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">Dokumen rahasia. Cetak sekarang bila diperlukan; setelah dialog ditutup password tidak dapat ditampilkan lagi.</p>
    </div>}
    <DialogFooter>
     {!generated?<><Button type="button" variant="outline" onClick={()=>setGenOpen(false)}>Batal</Button><Button type="button" onClick={generate} disabled={busy||!selected.length}>{busy?"Membuat…":`Buat ${selected.length} akun`}</Button></>
     :<><Button type="button" variant="outline" onClick={()=>window.print()}><PrinterIcon size={15}/> Cetak kredensial</Button><Button type="button" onClick={()=>{setGenOpen(false);setGenerated(null)}}>Selesai</Button></>}
    </DialogFooter>
   </DialogContent>
  </Dialog>
  <Dialog open={!!editTarget} onOpenChange={v=>{if(!v)setEditTarget(null)}}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Ubah akun</DialogTitle><DialogDescription>Ganti nomor peserta atau username manual untuk {editTarget?.studentName}. Password tidak berubah.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveEdit()}}>
    <Field label="Nomor peserta" hint="Huruf/angka/strip, maks. 20"><Input required maxLength={20} value={editNumber} onChange={e=>setEditNumber(e.target.value)}/></Field>
    <Field label="Username" hint="huruf kecil, 3-32 karakter"><Input required maxLength={32} value={editUsername} onChange={e=>setEditUsername(e.target.value.toLowerCase())}/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setEditTarget(null)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":"Simpan perubahan"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={!!resetInfo} onOpenChange={v=>{if(!v)setResetInfo(null)}}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Password baru</DialogTitle><DialogDescription>Password baru untuk {resetInfo?.name}. Salin sekarang — setelah ditutup tidak dapat dilihat lagi.</DialogDescription></DialogHeader>
   <Field label="Password sekali tampil"><Input readOnly value={resetInfo?.password||""} className="font-mono font-bold tracking-wider text-emerald-700"/></Field>
   <DialogFooter><Button type="button" onClick={()=>setResetInfo(null)}>Selesai</Button></DialogFooter>
  </DialogContent></Dialog>
  {dialog}
 </>;
}
