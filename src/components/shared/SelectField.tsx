import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./Field";
export type SelectOption={value:string;label:string};
type Props={label?:string;hint?:string;value:string;onValueChange:(value:string)=>void;options:SelectOption[];placeholder?:string;className?:string;triggerClassName?:string;disabled?:boolean;"aria-label"?:string};
export function SelectField({label,hint,value,onValueChange,options,placeholder,className,triggerClassName,disabled,...rest}:Props){
 const select=<Select value={value||undefined} onValueChange={onValueChange} disabled={disabled}>
  <SelectTrigger className={triggerClassName||"w-full"} {...rest}><SelectValue placeholder={placeholder||"Pilih…"}/></SelectTrigger>
  <SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
 </Select>;
 if(!label)return <div className={className}>{select}</div>;
 return <Field label={label} hint={hint} className={className}>{select}</Field>;
}
