"use client";
import { ArchiveIcon, ArchiveRestoreIcon, KeyRoundIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export function RowMenu({onEdit,onReset,toggle,onDelete}:{onEdit?:()=>void;onReset?:()=>void;toggle?:{label:string;archived:boolean;run:()=>void};onDelete:()=>void}){
 return <DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Aksi baris"><MoreHorizontalIcon size={16}/></Button></DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-44">
   {onEdit&&<DropdownMenuItem onClick={onEdit}><PencilIcon size={14}/> Ubah</DropdownMenuItem>}
   {onReset&&<DropdownMenuItem onClick={onReset}><KeyRoundIcon size={14}/> Reset password</DropdownMenuItem>}
   {toggle&&<DropdownMenuItem onClick={toggle.run}>{toggle.archived?<ArchiveRestoreIcon size={14}/>:<ArchiveIcon size={14}/>}{toggle.label}</DropdownMenuItem>}
   {(onEdit||onReset||toggle)&&<DropdownMenuSeparator/>}
   <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2Icon size={14}/> Hapus permanen</DropdownMenuItem>
  </DropdownMenuContent>
 </DropdownMenu>;
}
