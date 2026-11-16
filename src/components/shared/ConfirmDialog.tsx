"use client";
import { useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
type Prompt={title:string;description:string;confirmLabel:string;destructive:boolean};
export function useConfirm(){
 const [prompt,setPrompt]=useState<Prompt|null>(null);
 const resolver=useRef<((value:boolean)=>void)|null>(null);
 function confirm(title:string,description:string,options?:{confirmLabel?:string;destructive?:boolean}){
  return new Promise<boolean>(resolve=>{resolver.current=resolve;setPrompt({title,description,confirmLabel:options?.confirmLabel||"Ya, lanjutkan",destructive:!!options?.destructive})});
 }
 function settle(value:boolean){const done=resolver.current;resolver.current=null;setPrompt(null);done?.(value)}
 const dialog=<AlertDialog open={!!prompt} onOpenChange={open=>{if(!open&&resolver.current)settle(false)}}>
  <AlertDialogContent>
   <AlertDialogHeader><AlertDialogTitle>{prompt?.title}</AlertDialogTitle><AlertDialogDescription>{prompt?.description}</AlertDialogDescription></AlertDialogHeader>
   <AlertDialogFooter><AlertDialogCancel onClick={()=>settle(false)}>Batal</AlertDialogCancel><AlertDialogAction variant={prompt?.destructive?"destructive":"default"} onClick={()=>settle(true)}>{prompt?.confirmLabel}</AlertDialogAction></AlertDialogFooter>
  </AlertDialogContent>
 </AlertDialog>;
 return {confirm,dialog};
}
