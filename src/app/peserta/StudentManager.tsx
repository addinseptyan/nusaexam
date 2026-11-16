"use client";
import { useMemo, useState } from "react";
import { InboxIcon, PlusIcon, SearchIcon, FileSpreadsheetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { SelectField } from "@/components/shared/SelectField";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowMenu } from "@/components/shared/RowMenu";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import ImportDialog from "./ImportDialog";
type Student={id:string;name:string;nis:string;nisn:string;archived:boolean};
type Draft={name:string;nis:string;nisn:string};
const blank=():Draft=>({name:"",nis:"",nisn:""});
const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()).join("")||"?";
export default function StudentManager({students}:{students:Student[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const [search,setSearch]=useState(""); const [filter,setFilter]=useState("all");
 const [open,setOpen]=useState(false); const [editing,setEditing]=useState<Student|null>(null); const [importOpen,setImportOpen]=useState(false);
 const [draft,setDraft]=useState<Draft>(blank()); const [busy,setBusy]=useState(false);
 const filtered=useMemo(()=>{const q=search.trim().toLocaleLowerCase("id-ID");return students.filter(s=>(filter==="all"||(filter==="archived"?s.archived:!s.archived))&&(!q||`${s.name} ${s.nis} ${s.nisn}`.toLocaleLowerCase("id-ID").includes(q)))},[students,search,filter]);
 function openAdd(){setEditing(null);setDraft(blank());setOpen(true)}
 function openEdit(s:Student){setEditing(s);setDraft({name:s.name,nis:s.nis,nisn:s.nisn});setOpen(true)}
 async function save(){if(busy)return;setBusy(true);const ok=await request("/api/students",editing?"PATCH":"POST",editing?{...draft,id:editing.id,action:"edit"}:draft);setBusy(false);if(ok){setOpen(false);toast.success(editing?"Data peserta berhasil diperbarui.":"Peserta baru berhasil ditambahkan.")}}
 async function toggle(s:Student){const yes=await confirm(s.archived?"Pulihkan peserta":"Arsipkan peserta",`${s.archived?"Peserta akan kembali berstatus tersedia.":"Peserta tidak muncul pada daftar tersedia, tetapi datanya tetap tersimpan."} Lanjutkan untuk “${s.name}”?`,{confirmLabel:s.archived?"Pulihkan":"Arsipkan"});if(!yes)return;if(await request("/api/students","PATCH",{id:s.id,action:s.archived?"restore":"archive"}))toast.success(s.archived?"Peserta berhasil dipulihkan.":"Peserta berhasil diarsipkan.")}
 async function remove(s:Student){const yes=await confirm("Hapus permanen",`Data peserta “${s.name}” akan dihapus permanen dan tidak dapat dipulihkan. Gunakan arsip jika hanya ingin menyembunyikannya dari daftar.`,{confirmLabel:"Hapus permanen",destructive:true});if(!yes)return;if(await request("/api/students","DELETE",{id:s.id}))toast.success("Peserta berhasil dihapus permanen.")}
 return <>
  <div className="mb-4 flex flex-wrap items-center gap-2">
   <div className="relative min-w-[220px] flex-1"><SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="pl-9" placeholder="Cari nama, NIS, atau NISN…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <SelectField aria-label="Filter status" className="w-44" value={filter} onValueChange={setFilter} options={[{value:"all",label:"Semua status"},{value:"active",label:"Tersedia"},{value:"archived",label:"Diarsipkan"}]}/>
   <Button variant="outline" onClick={()=>setImportOpen(true)}><FileSpreadsheetIcon size={16}/> Impor Excel</Button><Button onClick={openAdd}><PlusIcon size={16}/> Tambah peserta</Button>
  </div>
  <Card title="Daftar peserta" description={`${filtered.length} dari ${students.length} peserta ditampilkan`} bodyClassName="p-0">
   {filtered.length===0?<EmptyState icon={InboxIcon} title="Tidak ada peserta yang cocok" description="Ubah kata kunci pencarian atau filter status, atau tambahkan peserta baru melalui tombol di atas."/>:<div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>Peserta</th><th className={thCls}>NIS / NISN</th><th className={thCls}>Status</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{filtered.map(s=><tr key={s.id} className="hover:bg-slate-50/60"><td className={tdCls}><div className="flex items-center gap-3"><Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-[11px] font-bold text-[var(--brand)]">{initials(s.name)}</AvatarFallback></Avatar><span className="font-semibold text-slate-800">{s.name}</span></div></td><td className={tdCls}><div className="text-xs">{s.nis||"—"}<span className="block text-slate-400">{s.nisn||"—"}</span></div></td><td className={tdCls}><StatusBadge archived={s.archived}/></td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={s.archived?undefined:()=>openEdit(s)} toggle={{label:s.archived?"Pulihkan":"Arsipkan",archived:s.archived,run:()=>toggle(s)}} onDelete={()=>remove(s)}/></div></td></tr>)}</tbody></table></div>}
  </Card>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing?"Ubah peserta":"Tambah peserta"}</DialogTitle><DialogDescription>{editing?"Perbarui identitas induk peserta.":"Isi identitas induk siswa. NIS dan NISN opsional, tetapi harus unik jika diisi."}</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();save()}}>
    <Field label="Nama lengkap"><Input required maxLength={120} placeholder="Contoh: Andi Saputra" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></Field>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label="NIS" hint="Opsional"><Input maxLength={32} placeholder="Nomor induk sekolah" value={draft.nis} onChange={e=>setDraft({...draft,nis:e.target.value})}/></Field>
     <Field label="NISN" hint="10 digit"><Input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="0012345678" value={draft.nisn} onChange={e=>setDraft({...draft,nisn:e.target.value})}/></Field>
    </div>
    <p className="text-[11px] leading-relaxed text-slate-400">NIS dan NISN disimpan sebagai teks agar angka nol di depan tidak hilang. Penempatan kelas, nomor peserta, dan akun ujian dibuat pada tahap berikutnya.</p>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":editing?"Simpan perubahan":"Tambah peserta"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  {dialog}
  <ImportDialog open={importOpen} onOpenChange={setImportOpen}/>
 </>;
}
