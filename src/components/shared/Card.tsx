import { cn } from "@/lib/utils";
export function Card({title,description,actions,children,className,bodyClassName}:{title?:string;description?:string;actions?:React.ReactNode;children?:React.ReactNode;className?:string;bodyClassName?:string}){
 return <section className={cn("rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,35,60,0.06)]",className)}>
  {(title||actions)&&<header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><div className="min-w-0"><h2 className="text-sm font-bold text-slate-800">{title}</h2>{description&&<p className="mt-0.5 text-xs text-slate-500">{description}</p>}</div>{actions&&<div className="flex items-center gap-2">{actions}</div>}</header>}
  <div className={cn("p-5",bodyClassName)}>{children}</div>
 </section>;
}
