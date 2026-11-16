"use client";
import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
export type ComboboxOption={value:string;label:string};
export function Combobox({options,value,onChange,placeholder="Pilih…",searchPlaceholder="Cari…",disabled}:{options:ComboboxOption[];value:string;onChange:(value:string)=>void;placeholder?:string;searchPlaceholder?:string;disabled?:boolean}){
 const [open,setOpen]=useState(false);
 const selected=options.find(o=>o.value===value);
 return <Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className={cn("w-full justify-between font-normal",!selected&&"text-slate-400")}><span className="truncate">{selected?selected.label:placeholder}</span><ChevronsUpDownIcon size={14} className="ml-2 shrink-0 text-slate-400"/></Button></PopoverTrigger>
  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
   <Command>
    <CommandInput placeholder={searchPlaceholder}/>
    <CommandList><CommandEmpty>Tidak ditemukan.</CommandEmpty><CommandGroup>{options.map(o=><CommandItem key={o.value} value={o.label} onSelect={()=>{onChange(o.value);setOpen(false)}}><CheckIcon size={14} className={cn("mr-2",value===o.value?"opacity-100":"opacity-0")}/>{o.label}</CommandItem>)}</CommandGroup></CommandList>
   </Command>
  </PopoverContent>
 </Popover>;
}
