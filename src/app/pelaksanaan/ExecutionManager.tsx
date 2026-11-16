"use client";
import { useMemo, useState } from "react";
import { CalendarClockIcon, PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
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
import { Pagination } from "@/components/shared/Pagination";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
type Execution={id:string;testId:string;testTitle:string;examPeriodId:string;periodName:string;kind:string;roomLabel:string;startAt:string;endAt:string;durationMinutes:number;assignedCount:number;shuffleQuestions:boolean;shuffleOptions:boolean;archived:boolean};
type Assignment={id:string;executionId:string;studentId:string;studentName:string};
type Draft={testId:string;examPeriodId:string;kind:string;roomLabel:string;start:string;end:string;duration:string;shuffleQ:boolean;shuffleO:boolean};
const KIND_LABEL:Record<string,string>={REGULER:"Reguler",SUSULAN:"Susulan",REMIDI:"Remidi"};
const KIND_CLS:Record<string,string>={REGULER:"bg-emerald-50 text-emerald-600",SUSULAN:"bg-amber-50 text-amber-600",REMIDI:"bg-sky-50 text-sky-600"};
const pad=(n:number)=>String(n).padStart(2,"0");
const toLocalInput=(iso:string)=>{const d=new Date(iso);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
const fmtWindow=(iso:string)=>new Date(iso).toLocaleString("id-ID",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
export default function ExecutionManager({executions,assignments,accounts,students,tests,periods}:{executions:Execution[];assignments:Assignment[];accounts:{examPeriodId:string;studentId:string}[];students:{id:string;name:string}[];tests:{id:string;title:string}[];periods:{id:string;name:string;academicYearLabel:string}[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const empty=():Draft=>({testId:tests[0]?.id||"",examPeriodId:periods[0]?.id||"",kind:"REGULER",roomLabel:"Ruang 1",start:"",end:"",duration:"90",shuffleQ:true,shuffleO:true});
 const [open,setOpen]=useState(false); const [editing,setEditing]=useState<Execution|null>(null); const [draft,setDraft]=useState<Draft>(empty());
 const [assignTarget,setAssignTarget]=useState<Execution|null>(null); const [assignSearch,setAssignSearch]=useState(""); const [selected,setSelected]=useState<string[]>([]);
 const [search,setSearch]=useState(""); const [kindFilter,setKindFilter]=useState("all"); const [periodFilter,setPeriodFilter]=useState("all"); const [sort,setSort]=useState("newest");
 const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState(10);
 const [busy,setBusy]=useState(false);
 const filtered=useMemo(()=>{
  const q=search.trim().toLocaleLowerCase("id-ID");
  const list=executions.filter(e=>(kindFilter==="all"||e.kind===kindFilter)&&(periodFilter==="all"||e.examPeriodId===periodFilter)&&(!q||`${e.testTitle} ${e.roomLabel}`.toLocaleLowerCase("id-ID").includes(q)));
  return list.sort((a,b)=>sort==="newest"?b.startAt.localeCompare(a.startAt):a.startAt.localeCompare(b.startAt));
 },[executions,search,kindFilter,periodFilter,sort]);
 const paged=filtered.slice((page-1)*pageSize,page*pageSize);
 function openAdd(){setOpen(true);setEditing(null);setDraft(empty())}
 function openEdit(e:Execution){setOpen(true);setEditing(e);setDraft({testId:e.testId,examPeriodId:e.examPeriodId,kind:e.kind,roomLabel:e.roomLabel,start:toLocalInput(e.startAt),end:toLocalInput(e.endAt),duration:String(e.durationMinutes),shuffleQ:e.shuffleQuestions,shuffleO:e.shuffleOptions})}
 async function save(){if(busy)return;setBusy(true);const payload={testId:draft.testId,examPeriodId:draft.examPeriodId,kind:draft.kind,roomLabel:draft.roomLabel,startAt:draft.start?new Date(draft.start).toISOString():"",endAt:draft.end?new Date(draft.end).toISOString():"",durationMinutes:Number(draft.duration),shuffleQuestions:draft.shuffleQ,shuffleOptions:draft.shuffleO};const ok=await request("/api/test-executions",editing?"PATCH":"POST",editing?{...payload,id:editing.id}:payload);setBusy(false);if(ok){setOpen(false);toast.success(editing?"Pelaksanaan berhasil diperbarui.":"Pelaksanaan baru berhasil dijadwalkan.")}}
 async function remove(e:Execution){const yes=await confirm("Hapus pelaksanaan",`Pelaksanaan “${e.testTitle}” (${KIND_LABEL[e.kind]}) beserta penugasannya akan dihapus permanen.`,{confirmLabel:"Hapus permanen",destructive:true});if(!yes)return;if(await request("/api/test-executions","DELETE",{id:e.id}))toast.success("Pelaksanaan berhasil dihapus.")}
 const assignedOf=useMemo(()=>assignTarget?assignments.filter(a=>a.executionId===assignTarget.id):[] ,[assignments,assignTarget]);
 const candidates=useMemo(()=>{
  if(!assignTarget)return [];
  const withAccount=new Set(accounts.filter(a=>a.examPeriodId===assignTarget.examPeriodId).map(a=>a.studentId));
  const assigned=new Set(assignedOf.map(a=>a.studentId));
  const q=assignSearch.trim().toLocaleLowerCase("id-ID");
  return students.filter(s=>withAccount.has(s.id)&&!assigned.has(s.id)&&(!q||s.name.toLocaleLowerCase("id-ID").includes(q)));
 },[assignTarget,accounts,assignedOf,students,assignSearch]);
 const allChecked=candidates.length>0&&candidates.every(c=>selected.includes(c.id));
 function openAssign(e:Execution){setAssignTarget(e);setAssignSearch("");setSelected([])}
 async function saveAssign(){if(busy||!assignTarget||!selected.length)return;setBusy(true);const res=await request("/api/test-assignments","POST",{executionId:assignTarget.id,studentIds:selected});setBusy(false);if(res){setSelected([]);toast.success(`${Number(res.assigned||0)} peserta ditugaskan.${Number(res.skippedNoAccount||0)?` ${res.skippedNoAccount} dilewati karena belum punya akun periode ini.`:""}`)}}
 async function unassign(a:Assignment){const yes=await confirm("Batalkan penugasan",`${a.studentName} tidak lagi melihat tes ini pada pelaksanaannya.`,{confirmLabel:"Batalkan"});if(!yes)return;if(await request("/api/test-assignments","DELETE",{id:a.id}))toast.success("Penugasan dibatalkan.")}
 const shuffleLabel=(e:Execution)=>e.shuffleQuestions&&e.shuffleOptions?"acak soal & pilihan":e.shuffleQuestions?"acak soal":e.shuffleOptions?"acak pilihan":"tanpa acak";
 return <>
  <div className="mb-4 flex flex-wrap items-center gap-2">
   <div className="relative min-w-[200px] flex-1"><SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="pl-9" placeholder="Cari tes atau ruang…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></div>
   <SelectField aria-label="Filter jenis" className="w-36" value={kindFilter} onValueChange={v=>{setKindFilter(v);setPage(1)}} options={[{value:"all",label:"Semua jenis"},{value:"REGULER",label:"Reguler"},{value:"SUSULAN",label:"Susulan"},{value:"REMIDI",label:"Remidi"}]}/>
   <SelectField aria-label="Filter periode" className="w-48" value={periodFilter} onValueChange={v=>{setPeriodFilter(v);setPage(1)}} options={[{value:"all",label:"Semua periode"},...periods.map(p=>({value:p.id,label:p.name}))]}/>
   <SelectField aria-label="Urutkan" className="w-40" value={sort} onValueChange={setSort} options={[{value:"newest",label:"Mulai terbaru"},{value:"oldest",label:"Mulai terlama"}]}/>
   <Button onClick={openAdd} disabled={!tests.length||!periods.length}><PlusIcon size={16}/> Jadwalkan pelaksanaan</Button>
  </div>
  <Card title="Daftar pelaksanaan" description={`${filtered.length} dari ${executions.length} pelaksanaan`} bodyClassName="p-0">
   {filtered.length===0?<EmptyState icon={CalendarClockIcon} title="Tidak ada pelaksanaan yang cocok" description={executions.length?"Ubah pencarian atau filter.":"Jadwalkan tes pada periode tertentu dengan jenis reguler, susulan, atau remidi."}/>:<><div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>Tes & jenis</th><th className={thCls}>Jendela waktu</th><th className={thCls}>Ruang, durasi & acak</th><th className={thCls}>Peserta</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{paged.map(e=><tr key={e.id} className="hover:bg-slate-50/60"><td className={tdCls}><strong className="block text-sm font-semibold text-slate-800">{e.testTitle}</strong><span className="mt-1 flex items-center gap-1.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",KIND_CLS[e.kind])}>{KIND_LABEL[e.kind]}</span><span className="text-[11px] text-slate-400">{e.periodName}</span></span></td><td className={tdCls+" text-xs"}>{fmtWindow(e.startAt)}<span className="block text-slate-400">s.d. {fmtWindow(e.endAt)}</span></td><td className={tdCls+" text-xs"}>{e.roomLabel}<span className="block text-slate-400">{e.durationMinutes} menit · {shuffleLabel(e)}</span></td><td className={tdCls}><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{e.assignedCount} peserta</span></td><td className={tdCls}><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openAssign(e)}><UsersIcon size={14}/> Peserta</Button><RowMenu onEdit={()=>openEdit(e)} onDelete={()=>remove(e)}/></div></td></tr>)}</tbody></table></div><Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={s=>{setPageSize(s);setPage(1)}}/></>}
   <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-400">Peserta hanya melihat tes yang ditugaskan kepadanya. Siswa yang login terlambat tetap mendapat sisa waktu jendela, bukan durasi penuh — diatur pada tahap pengerjaan.</p>
  </Card>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing?"Ubah pelaksanaan":"Jadwalkan pelaksanaan"}</DialogTitle><DialogDescription>Satu tes dapat dijadwalkan berkali-kali dengan jenis dan peserta berbeda.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();save()}}>
    <div className="grid gap-4 sm:grid-cols-2">
     <SelectField label="Tes" value={draft.testId} onValueChange={v=>setDraft({...draft,testId:v})} options={tests.map(t=>({value:t.id,label:t.title}))}/>
     <SelectField label="Periode" value={draft.examPeriodId} onValueChange={v=>setDraft({...draft,examPeriodId:v})} options={periods.map(p=>({value:p.id,label:`${p.name} (${p.academicYearLabel})`}))}/>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
     <SelectField label="Jenis pelaksanaan" value={draft.kind} onValueChange={v=>setDraft({...draft,kind:v})} options={[{value:"REGULER",label:"Reguler"},{value:"SUSULAN",label:"Susulan"},{value:"REMIDI",label:"Remidi"}]}/>
     <Field label="Ruang"><Input required maxLength={60} value={draft.roomLabel} onChange={e=>setDraft({...draft,roomLabel:e.target.value})}/></Field>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label="Mulai"><Input type="datetime-local" required value={draft.start} onChange={e=>setDraft({...draft,start:e.target.value})}/></Field>
     <Field label="Selesai"><Input type="datetime-local" required value={draft.end} onChange={e=>setDraft({...draft,end:e.target.value})}/></Field>
    </div>
    <Field label="Durasi pengerjaan (menit)" hint="1-600, tidak melebihi jendela"><Input type="number" min={1} max={600} required value={draft.duration} onChange={e=>setDraft({...draft,duration:e.target.value})}/></Field>
    <div className="grid gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
     <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><Checkbox checked={draft.shuffleQ} onCheckedChange={v=>setDraft({...draft,shuffleQ:v===true})}/> Acak urutan soal per peserta</label>
     <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><Checkbox checked={draft.shuffleO} onCheckedChange={v=>setDraft({...draft,shuffleO:v===true})}/> Acak urutan pilihan jawaban per peserta</label>
     <p className="text-[11px] leading-relaxed text-slate-400">Bila aktif, susunan soal dan pilihan diacak saat peserta mulai mengerjakan dan snapshot-nya disimpan per peserta, sehingga kunci jawaban tidak bocor antar peserta.</p>
    </div>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":editing?"Simpan perubahan":"Jadwalkan"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={!!assignTarget} onOpenChange={v=>{if(!v)setAssignTarget(null)}}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Peserta pelaksanaan</DialogTitle><DialogDescription>{assignTarget?`${assignTarget.testTitle} · ${KIND_LABEL[assignTarget.kind]} · ${assignTarget.roomLabel}`:null}. Kandidat adalah peserta yang memiliki akun pada periode pelaksanaan ini.</DialogDescription></DialogHeader>
   <div className="grid gap-3">
    <div>
     <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sudah ditugaskan ({assignedOf.length})</span>
     {assignedOf.length===0?<p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-400">Belum ada peserta ditugaskan.</p>:<div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200">{assignedOf.map(a=><div key={a.id} className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-1.5 text-xs last:border-0"><span className="truncate font-semibold text-slate-700">{a.studentName}</span><Button variant="ghost" size="xs" onClick={()=>unassign(a)}>Batalkan</Button></div>)}</div>}
    </div>
    <div className="overflow-hidden rounded-lg border border-slate-200">
     <div className="border-b border-slate-100 p-2"><div className="relative"><SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="h-8 pl-8 text-xs" placeholder="Cari nama…" value={assignSearch} onChange={e=>setAssignSearch(e.target.value)}/></div></div>
     <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-600"><Checkbox checked={allChecked} onCheckedChange={()=>setSelected(allChecked?selected.filter(id=>!candidates.some(c=>c.id===id)):[...new Set([...selected,...candidates.map(c=>c.id)])])} disabled={!candidates.length}/> Pilih semua hasil ({candidates.length})</label>
     <div className="max-h-44 overflow-y-auto p-1">{candidates.length===0?<p className="px-3 py-5 text-center text-[11px] text-slate-400">Tidak ada kandidat baru pada periode ini.</p>:candidates.map(c=><label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-slate-50"><Checkbox checked={selected.includes(c.id)} onCheckedChange={()=>setSelected(x=>x.includes(c.id)?x.filter(v=>v!==c.id):[...x,c.id])}/><span className="truncate font-semibold text-slate-700">{c.name}</span></label>)}</div>
    </div>
   </div>
   <DialogFooter><Button type="button" variant="outline" onClick={()=>setAssignTarget(null)}>Tutup</Button><Button type="button" onClick={saveAssign} disabled={busy||!selected.length}>{busy?"Menyimpan…":`Tugaskan ${selected.length} peserta`}</Button></DialogFooter>
  </DialogContent></Dialog>
  {dialog}
 </>;
}
