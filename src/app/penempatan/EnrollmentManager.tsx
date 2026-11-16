"use client";
import { useMemo, useState } from "react";
import { InboxIcon, SearchIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { SelectField } from "@/components/shared/SelectField";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowMenu } from "@/components/shared/RowMenu";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Year={id:string;label:string};
type Klass={id:string;name:string;grade:number;departmentCode:string;academicYearId:string;academicYearLabel:string;archived:boolean};
type Student={id:string;name:string;nis:string;archived:boolean};
type Enrollment={id:string;studentId:string;studentName:string;studentNis:string;studentArchived:boolean;classroomId:string;className:string;departmentCode:string;academicYearId:string;academicYearLabel:string};
const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()).join("")||"?";
export default function EnrollmentManager({years,classrooms,students,enrollments}:{years:Year[];classrooms:Klass[];students:Student[];enrollments:Enrollment[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const [yearFilter,setYearFilter]=useState("all"); const [classFilter,setClassFilter]=useState("all"); const [search,setSearch]=useState("");
 const [addOpen,setAddOpen]=useState(false); const [addClassId,setAddClassId]=useState(""); const [addSearch,setAddSearch]=useState(""); const [selected,setSelected]=useState<string[]>([]);
 const [moveTarget,setMoveTarget]=useState<Enrollment|null>(null); const [moveClassId,setMoveClassId]=useState("");
 const [busy,setBusy]=useState(false);
 const activeClasses=classrooms.filter(c=>!c.archived);
 const classOptions=activeClasses.map(c=>({value:c.id,label:`${c.academicYearLabel} · ${c.name}`}));
 const addYear=activeClasses.find(c=>c.id===addClassId)?.academicYearId||"";
 const candidates=useMemo(()=>{const q=addSearch.trim().toLocaleLowerCase("id-ID");return students.filter(s=>!s.archived&&!enrollments.some(e=>e.studentId===s.id&&e.academicYearId===addYear)&&(!q||`${s.name} ${s.nis}`.toLocaleLowerCase("id-ID").includes(q)))},[students,enrollments,addYear,addSearch]);
 const allChecked=candidates.length>0&&candidates.every(c=>selected.includes(c.id));
 const moveOptions=useMemo(()=>moveTarget?activeClasses.filter(c=>c.academicYearId===moveTarget.academicYearId&&c.id!==moveTarget.classroomId).map(c=>({value:c.id,label:c.name})):[] ,[activeClasses,moveTarget]);
 const filtered=useMemo(()=>{const q=search.trim().toLocaleLowerCase("id-ID");return enrollments.filter(e=>(yearFilter==="all"||e.academicYearId===yearFilter)&&(classFilter==="all"||e.classroomId===classFilter)&&(!q||`${e.studentName} ${e.studentNis} ${e.className}`.toLocaleLowerCase("id-ID").includes(q)))},[enrollments,yearFilter,classFilter,search]);
 const classFilterOptions=useMemo(()=>{const list=yearFilter==="all"?classrooms:classrooms.filter(c=>c.academicYearId===yearFilter);return [{value:"all",label:"Semua kelas"},...list.map(c=>({value:c.id,label:c.name}))]},[classrooms,yearFilter]);
 function openAdd(){setAddClassId(activeClasses[0]?.id||"");setAddSearch("");setSelected([]);setAddOpen(true)}
 function toggleOne(id:string){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 function toggleAll(){setSelected(allChecked?selected.filter(id=>!candidates.some(c=>c.id===id)):[...new Set([...selected,...candidates.map(c=>c.id)])])}
 function openMove(e:Enrollment){setMoveTarget(e);setMoveClassId("")}
 async function saveAdd(){if(busy||!selected.length)return;setBusy(true);const res=await request("/api/enrollments","POST",{classroomId:addClassId,studentIds:selected});setBusy(false);
  if(res){setAddOpen(false);const placed=Number(res.placed||0);const skipped=[...(res.skippedExisting as string[]||[]),...(res.skippedInvalid as string[]||[])];
   if(placed&&skipped.length)toast.success(`${placed} peserta ditempatkan. ${skipped.length} dilewati karena sudah memiliki kelas atau diarsipkan.`);
   else if(placed)toast.success(placed===1?"Peserta berhasil ditempatkan ke kelas.":`${placed} peserta berhasil ditempatkan ke kelas.`);
   else toast.warning("Tidak ada penempatan baru. Peserta pilihan sudah memiliki kelas pada tahun ajaran tersebut.");
  }}
 async function saveMove(){if(busy||!moveTarget||!moveClassId)return;setBusy(true);const ok=await request("/api/enrollments","PATCH",{id:moveTarget.id,classroomId:moveClassId});setBusy(false);if(ok){setMoveTarget(null);toast.success("Peserta berhasil dipindahkan ke kelas baru.")}}
 async function remove(e:Enrollment){const yes=await confirm("Hapus penempatan",`Penempatan “${e.studentName}” di kelas ${e.className} (${e.academicYearLabel}) akan dihapus. Riwayat nilai atau absensi pada tahap berikutnya tidak ikut terhapus.`,{confirmLabel:"Hapus penempatan",destructive:true});if(!yes)return;if(await request("/api/enrollments","DELETE",{id:e.id}))toast.success("Penempatan berhasil dihapus.")}
 return <>
  <div className="mb-4 flex flex-wrap items-center gap-2">
   <div className="relative min-w-[200px] flex-1"><SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="pl-9" placeholder="Cari peserta atau kelas…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <SelectField aria-label="Filter tahun ajaran" className="w-44" value={yearFilter} onValueChange={v=>{setYearFilter(v);setClassFilter("all")}} options={[{value:"all",label:"Semua tahun"},...years.map(y=>({value:y.id,label:y.label}))]}/>
   <SelectField aria-label="Filter kelas" className="w-44" value={classFilter} onValueChange={setClassFilter} options={classFilterOptions}/>
   <Button onClick={openAdd} disabled={!activeClasses.length||!students.some(s=>!s.archived)}><UserPlusIcon size={16}/> Tempatkan peserta</Button>
  </div>
  <Card title="Daftar penempatan" description={`${filtered.length} dari ${enrollments.length} penempatan ditampilkan`} bodyClassName="p-0">
   {filtered.length===0?<EmptyState icon={InboxIcon} title="Belum ada penempatan yang cocok" description={enrollments.length?"Ubah filter atau kata kunci pencarian.":"Tempatkan peserta aktif ke kelas melalui tombol di atas. Anda dapat memilih banyak peserta sekaligus dalam satu penyimpanan."}/> :<div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>Peserta</th><th className={thCls}>Kelas</th><th className={thCls}>Tahun ajaran</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{filtered.map(e=><tr key={e.id} className="hover:bg-slate-50/60"><td className={tdCls}><div className="flex items-center gap-3"><Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-[11px] font-bold text-[var(--brand)]">{initials(e.studentName)}</AvatarFallback></Avatar><span><span className="block font-semibold text-slate-800">{e.studentName}</span><span className="block text-xs text-slate-400">{e.studentNis||"Tanpa NIS"}</span></span>{e.studentArchived&&<span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500">Peserta diarsipkan</span>}</div></td><td className={tdCls}><strong className="font-semibold text-slate-800">{e.className}</strong><span className="block text-xs text-slate-500">{e.departmentCode}</span></td><td className={tdCls+" text-xs"}>{e.academicYearLabel}</td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={()=>openMove(e)} onDelete={()=>remove(e)}/></div></td></tr>)}</tbody></table></div>}
  </Card>
  <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Tempatkan peserta</DialogTitle><DialogDescription>Pilih kelas tujuan, lalu centang satu atau banyak peserta sekaligus. Peserta yang sudah punya kelas pada tahun ajaran ini tidak muncul di daftar.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveAdd()}}>
    <Field label="Kelas tujuan"><Combobox options={classOptions} value={addClassId} onChange={v=>{setAddClassId(v);setSelected([])}} placeholder="Pilih kelas" searchPlaceholder="Cari kelas…"/></Field>
    <Field label="Peserta" hint={`${selected.length} dipilih`}>
     <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-100 p-2"><div className="relative"><SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="h-8 pl-8 text-xs" placeholder="Cari nama atau NIS…" value={addSearch} onChange={e=>setAddSearch(e.target.value)}/></div></div>
      <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-600"><Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={!candidates.length}/> Pilih semua hasil ({candidates.length})</label>
      <div className="max-h-56 overflow-y-auto p-1">
       {candidates.length===0?<p className="px-3 py-6 text-center text-xs text-slate-400">{addClassId?"Tidak ada peserta tersedia untuk tahun ajaran ini.":"Pilih kelas terlebih dahulu."}</p>:candidates.map(c=><label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-xs hover:bg-slate-50"><Checkbox checked={selected.includes(c.id)} onCheckedChange={()=>toggleOne(c.id)}/><span className="min-w-0"><span className="block truncate font-semibold text-slate-700">{c.name}</span>{c.nis&&<span className="block truncate text-[11px] text-slate-400">{c.nis}</span>}</span></label>)}
      </div>
     </div>
    </Field>
    <p className="text-[11px] leading-relaxed text-slate-400">Satu peserta hanya dapat memiliki satu kelas per tahun ajaran. Untuk memindahkan peserta yang sudah ditempatkan, gunakan menu Ubah pada baris penempatan.</p>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setAddOpen(false)}>Batal</Button><Button type="submit" disabled={busy||!selected.length}>{busy?"Menyimpan…":selected.length>1?`Tempatkan ${selected.length} peserta`:"Tempatkan"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={!!moveTarget} onOpenChange={o=>{if(!o)setMoveTarget(null)}}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Pindahkan kelas</DialogTitle><DialogDescription>{moveTarget?`${moveTarget.studentName} saat ini berada di ${moveTarget.className} (${moveTarget.academicYearLabel}).`:null} Pilih kelas tujuan pada tahun ajaran yang sama.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveMove()}}>
    <Field label="Kelas tujuan"><Combobox options={moveOptions} value={moveClassId} onChange={setMoveClassId} placeholder="Pilih kelas tujuan" searchPlaceholder="Cari kelas…"/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setMoveTarget(null)}>Batal</Button><Button type="submit" disabled={busy||!moveClassId}>{busy?"Menyimpan…":"Pindahkan"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  {dialog}
 </>;
}
