import type { LucideIcon } from "lucide-react";
export function EmptyState({icon:Icon,title,description}:{icon:LucideIcon;title:string;description?:string}){
 return <div className="grid place-items-center gap-2 px-6 py-12 text-center"><span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-400"><Icon size={20}/></span><strong className="text-sm font-semibold text-slate-700">{title}</strong>{description&&<p className="max-w-xs text-xs leading-relaxed text-slate-500">{description}</p>}</div>;
}
