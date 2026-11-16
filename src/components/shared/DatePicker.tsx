"use client";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
export function DatePicker({value,onChange,placeholder="Pilih tanggal",min,className}:{value:string;onChange:(iso:string)=>void;placeholder?:string;min?:string;className?:string}){
 const [open,setOpen]=useState(false);
 const selected=value?parseISO(value):undefined;
 return <Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal",!value&&"text-slate-400",className)}><CalendarIcon size={15} className="mr-2 text-slate-400"/>{selected?format(selected,"dd MMM yyyy",{locale:id}):placeholder}</Button></PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
   <Calendar mode="single" locale={id} weekStartsOn={1} captionLayout="dropdown" startMonth={new Date(2000,0,1)} endMonth={new Date(2040,11,31)} selected={selected} disabled={min?{before:parseISO(min)}:undefined} onSelect={d=>{if(d){onChange(format(d,"yyyy-MM-dd"));setOpen(false)}}}/>
  </PopoverContent>
 </Popover>;
}
