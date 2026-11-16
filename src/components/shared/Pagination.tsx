import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export function Pagination({page,pageSize,total,onPage,onPageSize}:{page:number;pageSize:number;total:number;onPage:(page:number)=>void;onPageSize:(size:number)=>void}){
 const pages=Math.max(1,Math.ceil(total/pageSize));
 const current=Math.min(page,pages);
 return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
  <span>Halaman {current} dari {pages} · {total} baris</span>
  <div className="flex items-center gap-1.5">
   <Select value={String(pageSize)} onValueChange={v=>onPageSize(Number(v))}><SelectTrigger size="sm" className="w-[76px] text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="10">10 / hal</SelectItem><SelectItem value="25">25 / hal</SelectItem><SelectItem value="50">50 / hal</SelectItem></SelectContent></Select>
   <Button variant="outline" size="xs" disabled={current<=1} onClick={()=>onPage(current-1)}>Sebelumnya</Button>
   <Button variant="outline" size="xs" disabled={current>=pages} onClick={()=>onPage(current+1)}>Berikutnya</Button>
  </div>
 </div>;
}
