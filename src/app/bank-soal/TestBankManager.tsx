"use client";
import { useMemo, useState } from "react";
import { FileTextIcon, LayersIcon, ListPlusIcon, PlusIcon, SearchIcon, TextCursorInputIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const tabCls="flex-none rounded-none border-0 border-b-[3px] border-border px-5 py-2.5 text-muted-foreground hover:border-muted-foreground/60 hover:bg-muted/50 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";
import { toast } from "sonner";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { SelectField } from "@/components/shared/SelectField";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { RowMenu } from "@/components/shared/RowMenu";
import { Pagination } from "@/components/shared/Pagination";
import { tableCls, tableWrap, tdCls, thCls } from "@/components/shared/table";
import { useApi } from "@/components/shared/useApi";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import ImportItemsDialog from "./ImportItemsDialog";
import RichText from "@/components/shared/RichText";
import { cn } from "@/lib/utils";
type Bank={id:string;title:string;subject:string;description:string;archived:boolean;itemCount:number};
type Item={id:string;bankId:string;order:number;question:string;options:string[];correctIndex:number};
type Test={id:string;title:string;description:string;archived:boolean;createdAt:string};
type Composition={id:string;testId:string;bankId:string;bankTitle:string;count:number};
const LETTERS=["A","B","C","D","E"];
export default function TestBankManager({banks,items,tests,compositions}:{banks:Bank[];items:Item[];tests:Test[];compositions:Composition[]}){
 const {request}=useApi(); const {confirm,dialog}=useConfirm();
 const [tab,setTab]=useState("bank");
 const [bankSearch,setBankSearch]=useState(""); const [bankId,setBankId]=useState(banks[0]?.id||"");
 const [itemSearch,setItemSearch]=useState(""); const [itemPage,setItemPage]=useState(1); const [itemSize,setItemSize]=useState(10);
 const [testSearch,setTestSearch]=useState(""); const [testSort,setTestSort]=useState("newest"); const [testId,setTestId]=useState(tests[0]?.id||"");
 const [bankOpen,setBankOpen]=useState(false); const [bankEdit,setBankEdit]=useState<Bank|null>(null); const [bankDraft,setBankDraft]=useState({title:"",subject:"",description:""});
 const [itemOpen,setItemOpen]=useState(false); const [itemEdit,setItemEdit]=useState<Item|null>(null); const [itemDraft,setItemDraft]=useState({question:"",options:["","","",""],correctIndex:0});
 const [testOpen,setTestOpen]=useState(false); const [testEdit,setTestEdit]=useState<Test|null>(null); const [testDraft,setTestDraft]=useState({title:"",description:""});
 const [compOpen,setCompOpen]=useState(false); const [compEdit,setCompEdit]=useState<Composition|null>(null); const [compDraft,setCompDraft]=useState({bankId:"",count:"10"});
 const [importOpen,setImportOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const bank=banks.find(b=>b.id===bankId); const test=tests.find(t=>t.id===testId);
 const banksFiltered=useMemo(()=>{const q=bankSearch.trim().toLocaleLowerCase("id-ID");return banks.filter(b=>!q||`${b.title} ${b.subject}`.toLocaleLowerCase("id-ID").includes(q))},[banks,bankSearch]);
 const testsFiltered=useMemo(()=>{const q=testSearch.trim().toLocaleLowerCase("id-ID");const list=tests.filter(t=>!q||t.title.toLocaleLowerCase("id-ID").includes(q));return list.sort((a,b)=>testSort==="title"?a.title.localeCompare(b.title,"id"):testSort==="newest"?b.createdAt.localeCompare(a.createdAt):a.createdAt.localeCompare(b.createdAt))},[tests,testSearch,testSort]);
 const itemsFiltered=useMemo(()=>{const q=itemSearch.trim().toLocaleLowerCase("id-ID");return items.filter(i=>i.bankId===bankId&&(!q||i.question.toLocaleLowerCase("id-ID").includes(q)))},[items,bankId,itemSearch]);
 const itemsPaged=itemsFiltered.slice((itemPage-1)*itemSize,itemPage*itemSize);
 const testCompositions=useMemo(()=>compositions.filter(c=>c.testId===testId),[compositions,testId]);
 const totalComposition=testCompositions.reduce((s,c)=>s+c.count,0);
 const bankOptions=banks.filter(b=>!b.archived).map(b=>({value:b.id,label:`${b.title} (${b.itemCount} soal)`}));
 function openBankAdd(){setBankEdit(null);setBankDraft({title:"",subject:"",description:""});setBankOpen(true)}
 function openBankEdit(b:Bank){setBankEdit(b);setBankDraft({title:b.title,subject:b.subject,description:b.description});setBankOpen(true)}
 async function saveBank(){if(busy)return;setBusy(true);const ok=await request("/api/question-banks",bankEdit?"PATCH":"POST",bankEdit?{...bankDraft,id:bankEdit.id,action:"edit"}:bankDraft);setBusy(false);if(ok){setBankOpen(false);toast.success(bankEdit?"Bank soal diperbarui.":"Bank soal baru dibuat.")}}
 async function toggleBank(b:Bank){const yes=await confirm(b.archived?"Pulihkan bank":"Arsipkan bank",`${b.archived?"Bank kembali tersedia untuk komposisi tes.":"Bank tidak muncul pada pilihan komposisi baru; soal di dalamnya tetap utuh."} Lanjutkan untuk “${b.title}”?`,{confirmLabel:b.archived?"Pulihkan":"Arsipkan"});if(!yes)return;if(await request("/api/question-banks","PATCH",{id:b.id,action:b.archived?"restore":"archive"}))toast.success(b.archived?"Bank dipulihkan.":"Bank diarsipkan.")}
 async function removeBank(b:Bank){const yes=await confirm("Hapus permanen",`Bank “${b.title}” akan dihapus permanen. Bank yang masih berisi soal tidak dapat dihapus.`,{confirmLabel:"Hapus permanen",destructive:true});if(!yes)return;if(await request("/api/question-banks","DELETE",{id:b.id}))toast.success("Bank soal dihapus.")}
 function openItemAdd(){setItemEdit(null);setItemDraft({question:"",options:["","","",""],correctIndex:0});setItemOpen(true)}
 function openItemEdit(i:Item){setItemEdit(i);setItemDraft({question:i.question,options:[...i.options],correctIndex:i.correctIndex});setItemOpen(true)}
 function setOption(idx:number,value:string){setItemDraft(d=>({...d,options:d.options.map((o,i)=>i===idx?value:o)}))}
 function addOption(){setItemDraft(d=>d.options.length>=5?d:{...d,options:[...d.options,""]})}
 function dropOption(idx:number){setItemDraft(d=>d.options.length<=2?d:{...d,options:d.options.filter((_,i)=>i!==idx),correctIndex:d.correctIndex>=idx&&d.correctIndex>0?d.correctIndex-1:d.correctIndex})}
 async function saveItem(){if(busy||!bank)return;setBusy(true);const ok=await request("/api/test-items",itemEdit?"PATCH":"POST",itemEdit?{...itemDraft,id:itemEdit.id}:{...itemDraft,bankId:bank.id});setBusy(false);if(ok){setItemOpen(false);toast.success(itemEdit?"Soal diperbarui.":"Soal ditambahkan.")}}
 async function removeItem(i:Item){const yes=await confirm("Hapus soal",`Soal nomor ${i.order} akan dihapus dan urutan dirapikan otomatis.`,{confirmLabel:"Hapus soal",destructive:true});if(!yes)return;if(await request("/api/test-items","DELETE",{id:i.id}))toast.success("Soal dihapus.")}
 function openTestAdd(){setTestEdit(null);setTestDraft({title:"",description:""});setTestOpen(true)}
 function openTestEdit(t:Test){setTestEdit(t);setTestDraft({title:t.title,description:t.description});setTestOpen(true)}
 async function saveTest(){if(busy)return;setBusy(true);const ok=await request("/api/tests",testEdit?"PATCH":"POST",testEdit?{...testDraft,id:testEdit.id,action:"edit"}:testDraft);setBusy(false);if(ok){setTestOpen(false);toast.success(testEdit?"Tes diperbarui.":"Tes baru dibuat.")}}
 async function toggleTest(t:Test){const yes=await confirm(t.archived?"Pulihkan tes":"Arsipkan tes",`${t.archived?"Tes kembali tersedia.":"Tes tidak muncul pada pilihan pelaksanaan baru."} Lanjutkan untuk “${t.title}”?`,{confirmLabel:t.archived?"Pulihkan":"Arsipkan"});if(!yes)return;if(await request("/api/tests","PATCH",{id:t.id,action:t.archived?"restore":"archive"}))toast.success(t.archived?"Tes dipulihkan.":"Tes diarsipkan.")}
 async function removeTest(t:Test){const yes=await confirm("Hapus permanen",`Tes “${t.title}” akan dihapus permanen bersama komposisinya. Tes yang sudah punya pelaksanaan tidak dapat dihapus.`,{confirmLabel:"Hapus permanen",destructive:true});if(!yes)return;if(await request("/api/tests","DELETE",{id:t.id}))toast.success("Tes dihapus.")}
 function openCompAdd(){setCompEdit(null);setCompDraft({bankId:bankOptions[0]?.value||"",count:"10"});setCompOpen(true)}
 function openCompEdit(c:Composition){setCompEdit(c);setCompDraft({bankId:c.bankId,count:String(c.count)});setCompOpen(true)}
 async function saveComp(){if(busy||!test)return;setBusy(true);const ok=await request("/api/test-banks",compEdit?"PATCH":"POST",compEdit?{id:compEdit.id,count:Number(compDraft.count)}:{testId:test.id,bankId:compDraft.bankId,count:Number(compDraft.count)});setBusy(false);if(ok){setCompOpen(false);toast.success(compEdit?"Komposisi diperbarui.":"Bank ditambahkan ke komposisi tes.")}}
 async function removeComp(c:Composition){const yes=await confirm("Lepas bank dari tes",`Bank “${c.bankTitle}” tidak lagi menyumbang soal ke tes ini.`,{confirmLabel:"Lepas"});if(!yes)return;if(await request("/api/test-banks","DELETE",{id:c.id}))toast.success("Bank dilepas dari tes.")}
 return <>
  <Tabs value={tab} onValueChange={setTab}>
   <TabsList className="mb-4 h-auto w-full justify-start gap-0 rounded-none bg-transparent p-0">
    <TabsTrigger value="bank" className={tabCls}>Bank soal & soal</TabsTrigger>
    <TabsTrigger value="tes" className={tabCls}>Tes & komposisi</TabsTrigger>
   </TabsList>
   <TabsContent value="bank">
    <div className="grid gap-4 xl:grid-cols-2">
     <div className="grid content-start gap-4">
      <Card title="Bank soal" description={`${banks.length} bank · wadah setoran soal guru per mata pelajaran`} actions={<Button size="sm" onClick={openBankAdd}><PlusIcon size={15}/> Bank baru</Button>} bodyClassName="p-2">
       <div className="p-1 pb-2"><div className="relative"><SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="h-8 pl-8 text-xs" placeholder="Cari bank atau mata pelajaran…" value={bankSearch} onChange={e=>setBankSearch(e.target.value)}/></div></div>
       {banksFiltered.length===0?<EmptyState icon={LayersIcon} title="Tidak ada bank yang cocok" description="Buat bank per mata pelajaran, mis. Matematika X atau Produktif TKR."/>:banksFiltered.map(b=><div key={b.id} className={cn("mb-1 flex items-center gap-1 rounded-lg border px-2.5 py-2",b.id===bankId?"border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_6%,white)]":"border-transparent hover:bg-slate-50")}>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={()=>{setBankId(b.id);setItemPage(1)}}>
         <span className="flex items-center justify-between gap-2"><strong className="truncate text-xs font-bold text-slate-800">{b.title}</strong><StatusBadge archived={b.archived}/></span>
         <span className="mt-0.5 block truncate text-[11px] text-slate-400">{b.subject} · {b.itemCount} soal</span>
        </button>
        <RowMenu onEdit={()=>openBankEdit(b)} toggle={{label:b.archived?"Pulihkan":"Arsipkan",archived:b.archived,run:()=>toggleBank(b)}} onDelete={()=>removeBank(b)}/>
       </div>)}
      </Card>
     </div>
     <div>
      <Card title={bank?`Soal bank: ${bank.title}`:"Soal bank"} description={bank?`${itemsFiltered.length} soal cocok · ${bank.itemCount} total`:"Pilih bank di samping"} actions={bank&&!bank.archived&&<><Button size="sm" variant="outline" onClick={()=>setImportOpen(true)}><FileTextIcon size={15}/> Impor Word (.docx)</Button><Button size="sm" onClick={openItemAdd}><ListPlusIcon size={15}/> Tambah soal</Button></>} bodyClassName="p-0">
       <div className="border-b border-slate-100 p-2"><div className="relative"><SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="h-8 pl-8 text-xs" placeholder="Cari isi soal…" value={itemSearch} onChange={e=>{setItemSearch(e.target.value);setItemPage(1)}}/></div></div>
       {!bank?<EmptyState icon={TextCursorInputIcon} title="Tidak ada bank terpilih" description="Pilih atau buat bank soal terlebih dahulu."/>:itemsFiltered.length===0?<EmptyState icon={ListPlusIcon} title="Belum ada soal" description="Tambahkan manual atau impor dari Word."/>:(<><div className={tableWrap}><table className={tableCls}><thead><tr><th className={thCls+" w-10"}>#</th><th className={thCls}>Soal</th><th className={thCls+" w-16"}>Kunci</th><th className={thCls+" w-16 text-right"}>Aksi</th></tr></thead><tbody>{itemsPaged.map(i=><tr key={i.id} className="hover:bg-slate-50/60"><td className={tdCls+" text-xs font-bold"}>{i.order}</td><td className={tdCls}><span className="block text-xs font-semibold text-slate-800"><RichText text={i.question}/></span><span className="mt-1 block text-[11px] text-slate-500">{i.options.map((o,idx)=><span key={idx} className="block">{LETTERS[idx]}. <RichText text={o}/></span>)}</span></td><td className={tdCls}><span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-600">{LETTERS[i.correctIndex]}</span></td><td className={tdCls}><div className="flex justify-end"><RowMenu onEdit={()=>openItemEdit(i)} onDelete={()=>removeItem(i)}/></div></td></tr>)}</tbody></table></div><Pagination page={itemPage} pageSize={itemSize} total={itemsFiltered.length} onPage={setItemPage} onPageSize={s=>{setItemSize(s);setItemPage(1)}}/></>)}
      </Card>
     </div>
    </div>
   </TabsContent>
   <TabsContent value="tes">
    <div className="grid gap-4 xl:grid-cols-2">
     <div className="grid content-start gap-4">
      <Card title="Tes" description={`${tests.length} tes · disusun dari satu atau lebih bank`} actions={<Button size="sm" onClick={openTestAdd}><PlusIcon size={15}/> Tes baru</Button>} bodyClassName="p-2">
       <div className="flex gap-2 p-1 pb-2"><div className="relative flex-1"><SearchIcon size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/><Input className="h-8 pl-8 text-xs" placeholder="Cari judul tes…" value={testSearch} onChange={e=>setTestSearch(e.target.value)}/></div><SelectField value={testSort} onValueChange={setTestSort} className="w-32" triggerClassName="h-8 text-xs" options={[{value:"newest",label:"Terbaru"},{value:"oldest",label:"Terlama"},{value:"title",label:"Judul A-Z"}]}/></div>
       {testsFiltered.length===0?<EmptyState icon={TextCursorInputIcon} title="Tidak ada tes yang cocok" description="Buat tes sekali, pakai untuk reguler, susulan, dan remidi."/>:testsFiltered.map(t=><div key={t.id} className={cn("mb-1 flex items-center gap-1 rounded-lg border px-2.5 py-2",t.id===testId?"border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_6%,white)]":"border-transparent hover:bg-slate-50")}>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={()=>setTestId(t.id)}>
         <span className="flex items-center justify-between gap-2"><strong className="truncate text-xs font-bold text-slate-800">{t.title}</strong><StatusBadge archived={t.archived}/></span>
         <span className="mt-0.5 block truncate text-[11px] text-slate-400">{compositions.filter(c=>c.testId===t.id).reduce((s,c)=>s+c.count,0)} soal dari {compositions.filter(c=>c.testId===t.id).length} bank</span>
        </button>
        <RowMenu onEdit={()=>openTestEdit(t)} toggle={{label:t.archived?"Pulihkan":"Arsipkan",archived:t.archived,run:()=>toggleTest(t)}} onDelete={()=>removeTest(t)}/>
       </div>)}
      </Card>
     </div>
     <div>
      <Card title={test?`Komposisi: ${test.title}`:"Komposisi tes"} description={test?`${testCompositions.length} bank · total ${totalComposition} soal diambil`:"Pilih tes di samping"} actions={test&&!test.archived&&<Button size="sm" onClick={openCompAdd} disabled={!bankOptions.length}><PlusIcon size={15}/> Tambah bank</Button>} bodyClassName="p-0">
       {!test?<EmptyState icon={LayersIcon} title="Tidak ada tes terpilih" description="Pilih atau buat tes terlebih dahulu."/>:testCompositions.length===0?<EmptyState icon={LayersIcon} title="Komposisi masih kosong" description="Tambahkan bank soal dan tentukan berapa soal diambil dari tiap bank."/>:<div className="divide-y divide-slate-100">{testCompositions.map(c=><div key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5"><div className="min-w-0"><strong className="block truncate text-xs font-bold text-slate-800">{c.bankTitle}</strong><span className="text-[11px] text-slate-400">{c.count} soal diambil</span></div><RowMenu onEdit={()=>openCompEdit(c)} onDelete={()=>removeComp(c)}/></div>)}</div>}
       <p className="border-t border-slate-100 px-4 py-3 text-[11px] leading-relaxed text-slate-400">Saat pelaksanaan dimulai, server mengambil soal sesuai komposisi ini (acak per peserta bila diaktifkan) dan menyimpan snapshot per peserta.</p>
      </Card>
     </div>
    </div>
   </TabsContent>
  </Tabs>
  <Dialog open={bankOpen} onOpenChange={setBankOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{bankEdit?"Ubah bank soal":"Bank soal baru"}</DialogTitle><DialogDescription>Bank adalah wadah setoran soal guru per mata pelajaran atau per tahun.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveBank()}}>
    <Field label="Judul bank"><Input required maxLength={120} placeholder="Contoh: Produktif TKR 2026" value={bankDraft.title} onChange={e=>setBankDraft({...bankDraft,title:e.target.value})}/></Field>
    <Field label="Mata pelajaran"><Input required maxLength={100} placeholder="Contoh: Teknik Kendaraan Ringan" value={bankDraft.subject} onChange={e=>setBankDraft({...bankDraft,subject:e.target.value})}/></Field>
    <Field label="Deskripsi" hint="Opsional"><Textarea maxLength={500} rows={2} value={bankDraft.description} onChange={e=>setBankDraft({...bankDraft,description:e.target.value})}/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setBankOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":bankEdit?"Simpan perubahan":"Buat bank"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={itemOpen} onOpenChange={setItemOpen}><DialogContent><DialogHeader><DialogTitle>{itemEdit?`Ubah soal nomor ${itemEdit.order}`:"Tambah soal"}</DialogTitle><DialogDescription>Soal masuk ke bank {bank?.title}. Pilihan 2-5 dengan satu kunci.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveItem()}}>
    <Field label="Pertanyaan" hint="Teks ![gambar](…) atau ![rumus](…) tampil sebagai gambar pada pratinjau."><Textarea required maxLength={2000} rows={3} placeholder="Tulis pertanyaan…" value={itemDraft.question} onChange={e=>setItemDraft({...itemDraft,question:e.target.value})}/></Field>
    {(itemDraft.question.trim()||itemDraft.options.some(o=>o.trim()))&&<div className="grid gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
     <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pratinjau tampilan siswa</span>
     <div className="text-xs font-semibold text-slate-800"><RichText text={itemDraft.question||"—"}/></div>
     <div className="grid gap-1">{itemDraft.options.map((o,idx)=>o.trim()?<div key={idx} className="text-[11px] text-slate-600">{LETTERS[idx]}. <RichText text={o}/></div>:null)}</div>
    </div>}
    <div className="grid gap-2">
     <span className="text-xs font-semibold text-slate-600">Pilihan & kunci jawaban</span>
     {itemDraft.options.map((o,idx)=><div key={idx} className="flex items-center gap-2">
      <label className="grid size-8 shrink-0 cursor-pointer place-items-center" title={`Tandai ${LETTERS[idx]} sebagai kunci`}><input type="radio" name="kunci" checked={itemDraft.correctIndex===idx} onChange={()=>setItemDraft({...itemDraft,correctIndex:idx})} className="size-4 accent-[var(--brand)]"/><span className="sr-only">Kunci {LETTERS[idx]}</span></label>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-md font-mono text-xs font-bold",itemDraft.correctIndex===idx?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-500")}>{LETTERS[idx]}</span>
      <Input required maxLength={500} placeholder={`Pilihan ${LETTERS[idx]}`} value={o} onChange={e=>setOption(idx,e.target.value)}/>
      <Button type="button" variant="ghost" size="icon-sm" disabled={itemDraft.options.length<=2} onClick={()=>dropOption(idx)} aria-label={`Hapus pilihan ${LETTERS[idx]}`}>✕</Button>
     </div>)}
     <Button type="button" variant="outline" size="sm" className="justify-self-start" disabled={itemDraft.options.length>=5} onClick={addOption}><PlusIcon size={14}/> Tambah pilihan</Button>
    </div>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setItemOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":itemEdit?"Simpan perubahan":"Tambah soal"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={testOpen} onOpenChange={setTestOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{testEdit?"Ubah tes":"Tes baru"}</DialogTitle><DialogDescription>Judul tes unik; komposisi bank disusun setelah tes dibuat.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveTest()}}>
    <Field label="Judul tes"><Input required maxLength={120} placeholder="Contoh: Tes Produktif TKR Semester Ganjil" value={testDraft.title} onChange={e=>setTestDraft({...testDraft,title:e.target.value})}/></Field>
    <Field label="Deskripsi" hint="Opsional"><Textarea maxLength={500} rows={2} value={testDraft.description} onChange={e=>setTestDraft({...testDraft,description:e.target.value})}/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setTestOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":testEdit?"Simpan perubahan":"Buat tes"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  <Dialog open={compOpen} onOpenChange={setCompOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{compEdit?"Ubah jumlah soal":"Tambah bank ke komposisi"}</DialogTitle><DialogDescription>Tentukan berapa soal diambil dari bank ini untuk tes {test?.title}.</DialogDescription></DialogHeader>
   <form className="grid gap-4" onSubmit={e=>{e.preventDefault();saveComp()}}>
    <SelectField label="Bank soal" value={compDraft.bankId} onValueChange={v=>setCompDraft({...compDraft,bankId:v})} options={bankOptions} disabled={!!compEdit}/>
    <Field label="Jumlah soal diambil" hint="1-500, tidak melebihi isi bank"><Input type="number" min={1} max={500} required value={compDraft.count} onChange={e=>setCompDraft({...compDraft,count:e.target.value})}/></Field>
    <DialogFooter><Button type="button" variant="outline" onClick={()=>setCompOpen(false)}>Batal</Button><Button type="submit" disabled={busy}>{busy?"Menyimpan…":compEdit?"Simpan perubahan":"Tambah ke komposisi"}</Button></DialogFooter>
   </form>
  </DialogContent></Dialog>
  {bank&&<ImportItemsDialog open={importOpen} onOpenChange={setImportOpen} bankId={bank.id} bankTitle={bank.title}/>}
  {dialog}
 </>;
}
