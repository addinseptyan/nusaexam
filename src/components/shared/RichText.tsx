import type { ReactNode } from "react";
const MD_IMG="!\\[([^\\]]*)\\]\\((\\/api\\/media\\/items\\/[^)\\s]+)\\)";
const BARE_URL="(\\/api\\/media\\/items\\/[a-f0-9-]{36}\\.(?:png|jpe?g|gif|webp|bmp|svg))";
const RE=new RegExp(`${MD_IMG}|${BARE_URL}`,"gi");
export function hasMedia(text:string){RE.lastIndex=0;return RE.test(text)}
export default function RichText({text,className}:{text:string;className?:string}){
 RE.lastIndex=0;
 const nodes:ReactNode[]=[];
 let last=0;
 for(const m of text.matchAll(RE)){
  const idx=m.index??0;
  if(idx>last)nodes.push(text.slice(last,idx));
  const alt=m[1]??"";
  const url=m[2]??m[3]??"";
  nodes.push(<img key={`m${idx}`} src={url} alt={alt||"gambar"} loading="lazy" className="my-0.5 inline-block max-h-24 rounded border border-slate-200 bg-white align-middle"/>);
  last=idx+m[0].length;
 }
 if(last<text.length)nodes.push(text.slice(last));
 return <span className={"whitespace-pre-wrap "+(className??"")}>{nodes}</span>;
}
