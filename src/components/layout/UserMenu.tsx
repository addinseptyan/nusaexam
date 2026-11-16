"use client";
import { useRouter } from "next/navigation";
import { LogOutIcon, Settings2Icon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export default function UserMenu({username}:{username:string}){
 const router=useRouter();
 async function logout(){try{const r=await fetch("/api/logout",{method:"POST"});if(!r.ok)throw new Error();router.replace("/login");router.refresh()}catch{toast.error("Gagal keluar. Coba lagi.")}}
 return <DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-10 gap-2.5 px-1.5"><Avatar className="size-8"><AvatarFallback className="bg-[color-mix(in_srgb,var(--brand)_14%,white)] text-xs font-bold text-[var(--brand)]">{username.slice(0,1).toUpperCase()}</AvatarFallback></Avatar><span className="hidden text-left sm:block"><span className="block text-xs font-bold text-slate-800">{username}</span><span className="block text-[10px] text-slate-400">Administrator</span></span></Button></DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-52">
   <DropdownMenuLabel>{username}<span className="block text-[10px] font-normal text-slate-400">Administrator sistem</span></DropdownMenuLabel>
   <DropdownMenuSeparator/>
   <DropdownMenuItem onClick={()=>router.push("/pengaturan")}><Settings2Icon size={14}/> Tampilan & identitas</DropdownMenuItem>
   <DropdownMenuItem variant="destructive" onClick={logout}><LogOutIcon size={14}/> Keluar</DropdownMenuItem>
  </DropdownMenuContent>
 </DropdownMenu>;
}
