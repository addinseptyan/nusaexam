"use client";
import { useState } from "react";
import { GraduationCapIcon, InboxIcon, LayersIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { SelectField } from "@/components/shared/SelectField";
import { Combobox } from "@/components/shared/Combobox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowMenu } from "@/components/shared/RowMenu";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Year={id:string;label:string};
type Department={id:string;code:string;name:string;archived:boolean};
type Classroom={id:string;name:string;grade:number;academicYearId:string;academicYearLabel:string;departmentId:string;departmentCode:string;archived:boolean};
type DeptDraft={code:string;name:string};
type ClassDraft={name:string;grade:string;academicYearId:string;departmentId:string};
const gradeLabel=(g:number)=>g===10?"X":g===11?"XI":"XII";
export default function AcademicManager({years,departments,classrooms}:{years:Year[];departments:Department[];classrooms:Classroom[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const [deptOpen,setDeptOpen]=useState(false); const [deptEdit,setDeptEdit]=useState<Department|null>(null); const [dept,setDept]=useState<DeptDraft>({code:"",name:""});
 const [classOpen,setClassOpen]=useState(false); const [classEdit,setClassEdit]=useState<Classroom|null>(null); const [klass,setKlass]=useState<ClassDraft>({name:"",grade:"10",academicYearId:years[0]?.id||"",departmentId:""});
 const [busy,setBusy]=useState(false);
 const activeDepartments=departments.filter(d=>!d.archived);
 const deptOptions=activeDepartments.map(d=>({value:d.id,label:`${d.code} — ${d.name}`}));
 const yearOptions=years.map(y=>({value:y.id,label:y.label}));
 function openDeptAdd(){setDeptEdit(null);setDept({code:"",name:""});setDeptOpen(true)}
 function openDeptEdit(d:Department){setDeptEdit(d);setDept({code:d.code,name:d.name});setDeptOpen(true)}
 function openClassAdd(){setClassEdit(null);setKlass({name:"",grade:"10",academicYearId:years[0]?.id||"",departmentId:activeDepartments[0]?.id||""});setClassOpen(true)}
 function openClassEdit(c:Classroom){setClassEdit(c);setKlass({name:c.name,grade:String(c.grade),academicYearId:c.academicYearId,departmentId:c.departmentId});setClassOpen(true)}
 async function saveDept(){if(busy)return;setBusy(true);const ok=await request("/api/departments",deptEdit?"PATCH":"POST",deptEdit?{...dept,id:deptEdit.id,action:"edit"}:dept);setBusy(false);if(ok){setDeptOpen(false);toast.success(deptEdit?"Jurusan berhasil diperbarui.":"Jurusan baru berhasil ditambahkan.")}}
 async function saveClass(){if(busy)return;setBusy(true);const ok=await request("/api/classrooms",classEdit?"PATCH":"POST",classEdit?{...klass,grade:Number(klass.grade),id:classEdit.id,action:"edit"}:{...klass,grade:Number(klass.grade)});setBusy(false);if(ok){setClassOpen(false);toast.success(classEdit?"Kelas berhasil diperbarui.":"Kelas baru berhasil ditambahkan.")}}
 async function toggle(type:"departments"|"classrooms",item:{id:string;name:string;archived:boolean}){const yes=await confirm(item.archived?"Pulihkan data":"Arsipkan data",`${item.archived?"Data akan kembali berstatus tersedia.":"Data tidak muncul pada daftar tersedia, tetapi riwayatnya tetap tersimpan."} Lanjutkan untuk “${item.name}”?`,{confirmLabel:item.archived?"Pulihkan":"Arsipkan"});if(!yes)return;if(await request(`/api/${type}`,"PATCH",{id:item.id,action:item.archived?"restore":"archive"}))toast.success(item.archived?"Data berhasil dipulihkan.":"Data berhasil diarsipkan.")}
 async function remove(type:"departments"|"classrooms",item:{id:string;name:string}){const yes=await confirm("Hapus permanen",`Data “${item.name}” akan dihapus permanen dan tidak dapat dipulihkan. Gunakan arsip jika hanya ingin menyembunyikannya dari daftar.`,{confirmLabel:"Hapus permanen",destructive:true});if(!yes)return;if(await request(`/api/${type}`,"DELETE",{id:item.id}))toast.success("Data berhasil dihapus permanen.")}
 return <>
  <div className="grid gap-4 xl:grid-cols-2">
   <Card title="Jurusan" description={`${departments.length} jurusan tercatat`} actions={<Button size="sm" onClick={openDeptAdd}><PlusIcon size={15}/> Tambah jurusan</Button>} bodyClassName="p-0">
    {departments.length===0?<EmptyState icon={LayersIcon} title="Belum ada jurusan" description="Tambahkan jurusan seperti AK, TKJ, atau RPL sebagai dasar pembuatan kelas."/>:<div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>Jurusan</th><th className={thCls}>Status</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{departments.map(d=><tr key={d.id} className="hover:bg-slate-50/60"><td className={tdCls}><strong className="font-semibold text-slate-800">{d.code}</strong><span className="block text-xs text-slate-500">{d.name}</span></td><td className={tdCls}><StatusBadge archived={d.archived}/></td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={d.archived?undefined:()=>openDeptEdit(d)} toggle={{label:d.archived?"Pulihkan":"Arsipkan",archived:d.archived,run:()=>toggle("departments",d)}} onDelete={()=>remove("departments",d)}/></div></td></tr>)}</tbody></table></div>}
    <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-400">Jurusan yang masih memiliki kelas tidak dapat diarsipkan maupun dihapus permanen.</p>
   </Card>
   <Card title="Kelas" description={`${classrooms.length} kelas tercatat`} actions={<Button size="sm" onClick={openClassAdd} disabled={!years.length||!activeDepartments.length}><PlusIcon size={15}/> Tambah kelas</Button>} bodyClassName="p-0">
    {classrooms.length===0?<EmptyState icon={GraduationCapIcon} title="Belum ada kelas" description={years.length&&activeDepartments.length?"Tambahkan kelas untuk setiap tahun ajaran, contohnya X AK 1.":"Siapkan tahun ajaran dan jurusan terlebih dahulu."}/>:<div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls}>Kelas</th><th className={thCls}>Tahun ajaran</th><th className={thCls}>Status</th><th className={thCls+" text-right"}>Aksi</th></tr></thead><tbody>{classrooms.map(c=><tr key={c.id} className="hover:bg-slate-50/60"><td className={tdCls}><strong className="font-semibold text-slate-800">{c.name}</strong><span className="block text-xs text-slate-500">Tingkat {gradeLabel(c.grade)} · {c.departmentCode}</span></td><td className={tdCls+" text-xs"}>{c.academicYearLabel}</td><td className={tdCls}><StatusBadge archived={c.archived}/></td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={c.archived?undefined:()=>openClassEdit(c)} toggle={{label:c.archived?"Pulihkan":"Arsipkan",archived:c.archived,run:()=>toggle("classrooms",c)}} onDelete={()=>remove("classrooms",c)}/></div></td></tr>)}</tbody></table></div>}
    <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-400">Nama kelas harus unik dalam satu tahun ajaran. Kelas tidak dapat dipulihkan selama jurusannya masih diarsipkan.</p>
   </Card>
  </div>
  <Dialog open={deptOpen} onOpenChange={setDeptOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{deptEdit?"Ubah jurusan":"Tambah jurusan"}</DialogTitle><DialogDescription>Kode jurusan dipakai sebagai awalan nama kelas dan harus unik.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveDept()}}>
    <Field label="Kode jurusan"><Input required maxLength={12} pattern="[A-Za-z0-9-]+" placeholder="Contoh: AK" value={dept.code} onChange={e=>setDept({...dept,code:e.target.value.toUpperCase()})}/></Field>
    <Field label="Nama jurusan"><Input required maxLength={100} placeholder="Contoh: Akuntansi" value={dept.name} onChange={e=>setDept({...dept,name:e.target.value})}/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setDeptOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":deptEdit?"Simpan perubahan":"Tambah jurusan"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={classOpen} onOpenChange={setClassOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{classEdit?"Ubah kelas":"Tambah kelas"}</DialogTitle><DialogDescription>Pilih tahun ajaran, tingkat, dan jurusan untuk kelas ini.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveClass()}}>
    <Field label="Nama kelas"><Input required maxLength={100} placeholder="Contoh: X AK 1" value={klass.name} onChange={e=>setKlass({...klass,name:e.target.value})}/></Field>
    <div className="grid gap-4 sm:grid-cols-2">
     <SelectField label="Tingkat" value={klass.grade} onValueChange={v=>setKlass({...klass,grade:v})} options={[{value:"10",label:"X (10)"},{value:"11",label:"XI (11)"},{value:"12",label:"XII (12)"}]}/>
     <SelectField label="Tahun ajaran" value={klass.academicYearId} onValueChange={v=>setKlass({...klass,academicYearId:v})} options={yearOptions} placeholder="Pilih tahun"/>
    </div>
    <Field label="Jurusan"><Combobox options={deptOptions} value={klass.departmentId} onChange={v=>setKlass({...klass,departmentId:v})} placeholder="Pilih jurusan" searchPlaceholder="Cari jurusan…"/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setClassOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":classEdit?"Simpan perubahan":"Tambah kelas"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  {dialog}
 </>;
}
