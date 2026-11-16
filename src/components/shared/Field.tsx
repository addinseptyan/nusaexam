import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
export function Field({label,hint,children,className}:{label:string;hint?:string;children:React.ReactNode;className?:string}){
 return <div className={cn("grid gap-1.5",className)}>
  <Label className="flex items-baseline justify-between gap-2 text-xs font-semibold text-slate-600">{label}{hint&&<span className="text-[11px] font-normal text-slate-400">{hint}</span>}</Label>
  {children}
 </div>;
}
