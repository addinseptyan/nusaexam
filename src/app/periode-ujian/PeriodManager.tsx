"use client";
import { FormEvent, useState } from "react";
import { CalendarDaysIcon, CalendarPlusIcon, InboxIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { SelectField } from "@/components/shared/SelectField";
import { DatePicker } from "@/components/shared/DatePicker";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowMenu } from "@/components/shared/RowMenu";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Year={id:string;label:string};
type Period={id:string;name:string;description:string;semester:"GANJIL"|"GENAP";academicYearId:string;academicYearLabel:string;startDate:string;endDate:string;archived:boolean};
type Draft={name:string;description:string;semester:string;academicYearId:string;startDate:string;endDate:string};
const empty=(yearId:string):Draft=>({name:"",description:"",semester:"GANJIL",academicYearId:yearId,startDate:"",endDate:""});
const fmt=(date:string)=>{const [y,m,d]=date.split("-");return `${d}/${m}/${y}`};
export default function PeriodManager({years,periods}:{years:Year[];periods:Period[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const [yearLabel,setYearLabel]=useState(""); const [yearBusy,setYearBusy]=useState(false);
 const [open,setOpen]=useState(false); const [editing,setEditing]=useState<Period|null>(null);
 const [draft,setDraft]=useState<Draft>(empty(years[0]?.id||"")); const [busy,setBusy]=useState(false);
 const yearOptions=years.map(y=>({value:y.id,label:y.label}));
 async function addYear(e:FormEvent){e.preventDefault();if(yearBusy)return;setYearBusy(true);const ok=await request("/api/academic-years","POST",{label:yearLabel});setYearBusy(false);if(ok){setYearLabel("");toast.success("Tahun ajaran ditambahkan. Pilih tahun tersebut pada formulir periode.")}}
 function openAdd(){setEditing(null);setDraft(empty(years[0]?.id||""));setOpen(true)}
 function openEdit(p:Period){setEditing(p);setDraft({name:p.name,description:p.description,semester:p.semester,academicYearId:p.academicYearId,startDate:p.startDate,endDate:p.endDate});setOpen(true)}
 async function save(){if(busy)return;setBusy(true);const ok=await request("/api/exam-periods",editing?"PATCH":"POST",editing?{...draft,id:editing.id,action:"edit"}:draft);setBusy(false);if(ok){setOpen(false);toast.success(editing?"Periode berhasil diperbarui.":"Periode ujian baru berhasil ditambahkan.")}}
 async function toggle(p:Period){const yes=await confirm(p.archived?"Pulihkan periode":"Arsipkan periode",`${p.archived?"Periode akan kembali berstatus tersedia.":"Periode tidak muncul pada daftar tersedia, tetapi datanya tetap tersimpan."} Lanjutkan untuk “${p.name}”?`,{confirmLabel:p.archived?"Pulihkan":"Arsipkan"});if(!yes)return;if(await request("/api/exam-periods","PATCH",{id:p.id,action:p.archived?"restore":"archive"}))toast.success(p.archived?"Periode berhasil dipulihkan.":"Periode berhasil diarsipkan.")}
 async function remove(p:Period){const yes=await confirm("Hapus permanen",`Periode “${p.name}” akan dihapus permanen dan tidak dapat dipulihkan. Gunakan arsip jika hanya ingin menyembunyikannya dari daftar.`,{confirmLabel:"Hapus permanen",destructive:true});if(!yes)return;if(await request("/api/exam-periods","DELETE",{id:p.id}))toast.success("Periode berhasil dihapus permanen.")}
 return <>
  <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
   <div className="grid content-start gap-4">
    <Card title="Tahun ajaran" description="Dasar pengelompokan periode dan kelas." bodyClassName="p-4">
     <form className="flex gap-2" onSubmit={addYear}><Input placeholder="Contoh: 2026/2027" pattern="[0-9]{4}/[0-9]{4}" maxLength={9} required value={yearLabel} onChange={e=>setYearLabel(e.target.value)}/><Button type="submit" variant="outline" size="icon" disabled={yearBusy} aria-label="Tambah tahun ajaran"><PlusIcon size={15}/></Button></form>
     <div className="mt-3 flex flex-wrap gap-1.5">{years.length?years.map(y=><span key={y.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{y.label}</span>):<span className="text-xs text-slate-400">Belum ada tahun ajaran.</span>}</div>
    </Card>
    <Card bodyClassName="p-4" className="border-transparent bg-[color-mix(in_srgb,var(--brand)_6%,white)]">
     <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--brand)] shadow-sm"><CalendarDaysIcon size={17}/></span><p className="text-xs leading-relaxed text-slate-600">Buat tahun ajaran terlebih dahulu, lalu tambahkan periode ujian. Jadwal, peserta, dan sesi disusun pada tahap penjadwalan.</p></div>
    </Card>
   </div>
   <Card title="Daftar periode" description={`${periods.length} periode tercatat`} actions={<Button size="sm" onClick={openAdd} disabled={!years.length}><CalendarPlusIcon size={15}/> Tambah periode</Button>} bodyClassName="p-0">
    {periods.length===0?<EmptyState icon={InboxIcon} title="Belum ada periode ujian" description={years.length?"Tambahkan periode seperti Ujian Semester Ganjil melalui tombol di atas.":"Tambahkan tahun ajaran terlebih dahulu pada panel kiri."}/>:<div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>Periode</th><th className={thCls}>Waktu pelaksanaan</th><th className={thCls}>Status</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{periods.map(p=><tr key={p.id} className="hover:bg-slate-50/60"><td className={tdCls}><strong className="font-semibold text-slate-800">{p.name}</strong><span className="block text-xs text-slate-500">{p.academicYearLabel} · {p.semester==="GANJIL"?"Ganjil":"Genap"}</span>{p.description&&<span className="block text-xs text-slate-400">{p.description}</span>}</td><td className={tdCls+" text-xs"}>{fmt(p.startDate)}<span className="block text-slate-400">s.d. {fmt(p.endDate)}</span></td><td className={tdCls}><StatusBadge archived={p.archived}/></td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={p.archived?undefined:()=>openEdit(p)} toggle={{label:p.archived?"Pulihkan":"Arsipkan",archived:p.archived,run:()=>toggle(p)}} onDelete={()=>remove(p)}/></div></td></tr>)}</tbody></table></div>}
   </Card>
  </div>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing?"Ubah periode":"Tambah periode"}</DialogTitle><DialogDescription>Periode mengelompokkan kegiatan ujian dalam satu tahun ajaran dan semester.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();save()}}>
    <Field label="Nama periode"><Input required maxLength={100} placeholder="Contoh: Ujian Semester Ganjil" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field>
    <div className="grid gap-4 sm:grid-cols-2">
     <SelectField label="Tahun ajaran" value={draft.academicYearId} onValueChange={v=>setDraft({...draft,academicYearId:v})} options={yearOptions} placeholder="Pilih tahun"/>
     <SelectField label="Semester" value={draft.semester} onValueChange={v=>setDraft({...draft,semester:v})} options={[{value:"GANJIL",label:"Ganjil"},{value:"GENAP",label:"Genap"}]}/>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label="Tanggal mulai"><DatePicker value={draft.startDate} onChange={v=>setDraft({...draft,startDate:v,endDate:draft.endDate&&draft.endDate<v?"":draft.endDate})} placeholder="Pilih tanggal mulai"/></Field>
     <Field label="Tanggal selesai"><DatePicker value={draft.endDate} min={draft.startDate||undefined} onChange={v=>setDraft({...draft,endDate:v})} placeholder="Pilih tanggal selesai"/></Field>
    </div>
    <Field label="Deskripsi" hint="Opsional"><Textarea maxLength={500} rows={3} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":editing?"Simpan perubahan":"Tambah periode"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  {dialog}
 </>;
}
