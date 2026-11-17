"use client";
import { useCallback, useEffect, useState } from "react";
import { DatabaseBackupIcon, DownloadIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
type Row={name:string;size:number;savedAt:string};
export default function BackupManager(){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const [rows,setRows]=useState<Row[]|null>(null); const [busy,setBusy]=useState("");
 const load=useCallback(()=>{fetch("/api/backup").then(r=>r.json()).then(j=>{if(j?.ok)setRows(j.rows as Row[])}).catch(()=>setRows([]))},[]);
 useEffect(()=>{load()},[load]);
 async function act(action:"create"|"restore"|"delete",file?:string){
  if(busy)return; setBusy(action+(file??""));
  const res=await request("/api/backup","POST",{action,file});
  setBusy("");
  if(!res)return;
  if(action==="create"){toast.success(`Backup ${res.name} tersimpan.`);load()}
  if(action==="restore"){toast.success("Restore selesai. Muat ulang halaman untuk melihat data terpulihkan.");load()}
  if(action==="delete"){toast.success("Berkas backup dihapus.");load()}
 }
 async function restore(row:Row){
  const yes=await confirm("Restore backup ini",`SELURUH data aplikasi saat ini akan DIGANTIKAN isi backup ${row.name}. Semua pengguna akan logout. Lanjutkan?`,{confirmLabel:"Ya, replace semua data",destructive:true});
  if(yes)await act("restore",row.name);
 }
 async function remove(row:Row){
  const yes=await confirm("Hapus berkas backup",`Berkas ${row.name} dihapus permanen dari folder backup server.`,{confirmLabel:"Hapus",destructive:true});
  if(yes)await act("delete",row.name);
 }
 return <div className="grid gap-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="max-w-xl text-xs leading-relaxed text-slate-500">Backup berisi seluruh tabel aplikasi (peserta, akun, soal, attempt, nilai) dalam satu berkas JSON di folder <code className="rounded bg-slate-100 px-1">backup/</code> server (atau env <code className="rounded bg-slate-100 px-1">BACKUP_DIR</code>). Untuk backup terjadwal tanpa login, jalankan <code className="rounded bg-slate-100 px-1">node scripts/backup-now.mjs</code> lewat Task Scheduler.</p>
   <Button type="button" disabled={!!busy} onClick={()=>act("create")}><DatabaseBackupIcon size={15}/> Buat backup sekarang</Button>
  </div>
  {rows===null?<p className="text-xs text-slate-500">Memuat daftar backup…</p>:rows.length===0?<div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">Belum ada berkas backup. Klik “Buat backup sekarang”.</div>:<div className={tableWrap}><table className={tableCls}>
   <thead><tr><th className={thCls}>Berkas</th><th className={thCls+" w-28 text-right"}>Ukuran</th><th className={thCls+" w-44"}>Disimpan</th><th className={thCls+" w-56 text-right"}>Aksi</th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.name} className="hover:bg-slate-50/60">
    <td className={tdCls+" font-mono text-xs"}>{r.name}</td>
    <td className={tdCls+" text-right text-xs"}>{(r.size/1024).toFixed(0)} KB</td>
    <td className={tdCls+" text-xs"}>{new Date(r.savedAt).toLocaleString("id-ID")}</td>
    <td className={tdCls}><div className="flex justify-end gap-1">
     <Button type="button" variant="ghost" size="sm" asChild><a href={`/api/backup/download?file=${r.name}`}><DownloadIcon size={14}/> Unduh</a></Button>
     <Button type="button" variant="ghost" size="sm" disabled={!!busy} onClick={()=>restore(r)}><RefreshCwIcon size={14}/> Restore</Button>
     <Button type="button" variant="ghost" size="sm" disabled={!!busy} onClick={()=>remove(r)} aria-label="Hapus backup"><Trash2Icon size={14}/></Button>
    </div></td>
   </tr>)}</tbody>
  </table></div>}
  <div className="notice-box"><strong>Restore bersifat menyeluruh</strong><p>Restore menghapus isi semua tabel lalu memasukkan isi backup, termasuk akun operator dan sesi (semua pihak logout). Uji restore secara berkala di mesin pengembangan, bukan langsung di server ujian.</p></div>
  {dialog}
 </div>;
}
