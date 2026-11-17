"use client";
import { useEffect, useState, type ReactNode } from "react";
import { XIcon, ZoomInIcon } from "lucide-react";
const MD_IMG="!\\[([^\\]]*)\\]\\((\\/api\\/media\\/items\\/[^)\\s]+)\\)";
const BARE_URL="(\\/api\\/media\\/items\\/[a-f0-9-]{36}\\.(?:png|jpe?g|gif|webp|bmp|svg))";
const RE=new RegExp(`${MD_IMG}|${BARE_URL}`,"gi");
export function hasMedia(text:string){RE.lastIndex=0;return RE.test(text)}
export default function RichText({text,className}:{text:string;className?:string}){
 const [zoom,setZoom]=useState<string|null>(null);
 useEffect(()=>{
  if(!zoom)return;
  const h=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(null)};
  window.addEventListener("keydown",h);
  return ()=>window.removeEventListener("keydown",h);
 },[zoom]);
 RE.lastIndex=0;
 const nodes:ReactNode[]=[];
 let last=0;
 for(const m of text.matchAll(RE)){
  const idx=m.index??0;
  if(idx>last)nodes.push(text.slice(last,idx));
  const alt=m[1]??"";
  const url=m[2]??m[3]??"";
  nodes.push(<button type="button" key={`m${idx}`} onClick={()=>setZoom(url)} title="Klik untuk memperbesar" className="group relative my-0.5 inline-block align-middle">
   <img src={url} alt={alt||"gambar"} loading="lazy" className="max-h-24 rounded border border-slate-200 bg-white"/>
   <span className="absolute right-1 top-1 hidden rounded-md bg-black/55 p-0.5 text-white group-hover:block"><ZoomInIcon size={12}/></span>
  </button>);
  last=idx+m[0].length;
 }
 if(last<text.length)nodes.push(text.slice(last));
 return <>
  <span className={"whitespace-pre-wrap "+(className??"")}>{nodes}</span>
  {zoom&&<div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] grid cursor-zoom-out place-items-center bg-black/80 p-6" onClick={()=>setZoom(null)}>
   <img src={zoom} alt="Perbesar gambar" className="max-h-[85vh] max-w-full rounded-lg bg-white p-2"/>
   <button type="button" aria-label="Tutup pratinjau gambar" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"><XIcon size={18}/></button>
  </div>}
 </>;
}
