import { cn } from "@/lib/utils";
export function StatusBadge({archived}:{archived:boolean}){
 return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",archived?"bg-rose-50 text-rose-600":"bg-emerald-50 text-emerald-600")}><span className={cn("size-1.5 rounded-full",archived?"bg-rose-400":"bg-emerald-500")}/>{archived?"Diarsipkan":"Tersedia"}</span>;
}
