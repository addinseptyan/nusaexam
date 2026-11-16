import JSZip from "jszip";
import { IMG_MIME } from "./imgMime";

export type ImportImage={blob:Blob;mime:string;ext:string;url:string};
export type ImportRow={row:number;question:string;options:string[];correctIndex:number;status:"ok"|"invalid";reason?:string};
export type ImportParsed={rows:ImportRow[];skipped:number;images:ImportImage[]};

/* Linearisasi rumus OMML menjadi teks polos (jalan cadangan bila render SVG gagal). */
function linMath(el:Element):string{
 const kids=Array.from(el.children);
 const pick=(tag:string)=>kids.find(k=>k.nodeName===tag);
 const all=()=>kids.map(linMath).join("");
 switch(el.nodeName){
  case "m:t":return el.textContent||"";
  case "m:f":{const n=pick("m:num");const d=pick("m:den");return `${n?linMath(n):""}/${d?linMath(d):""}`}
  case "m:sSup":{const e=pick("m:e");const s=pick("m:sup");return `${e?linMath(e):""}^${s?linMath(s):""}`}
  case "m:sSub":{const e=pick("m:e");const s=pick("m:sub");return `${e?linMath(e):""}_${s?linMath(s):""}`}
  case "m:sSubSup":{const e=pick("m:e");const s=pick("m:sub");const p=pick("m:sup");return `${e?linMath(e):""}_${s?linMath(s):""}^${p?linMath(p):""}`}
  case "m:rad":{const e=pick("m:e");return `√(${e?linMath(e):""})`}
  case "m:d":{const es=kids.filter(k=>k.nodeName==="m:e");return `(${es.map(linMath).join(",")})`}
  default:return all();
 }
}

/* Konversi rumus OMML menjadi TeX untuk dirender MathJax. */
function texMath(el:Element):string{
 const kids=Array.from(el.children);
 const pick=(tag:string)=>kids.find(k=>k.nodeName===tag);
 const all=()=>kids.map(texMath).join("");
 const esc=(s:string)=>s.replace(/([\\{}&%#])/g,"\\$1");
 switch(el.nodeName){
  case "m:t":return esc(el.textContent||"");
  case "m:f":{const n=pick("m:num");const d=pick("m:den");return `\\frac{${n?texMath(n):""}}{${d?texMath(d):""}}`}
  case "m:sSup":{const e=pick("m:e");const s=pick("m:sup");return `${e?texMath(e):""}^{${s?texMath(s):""}}`}
  case "m:sSub":{const e=pick("m:e");const s=pick("m:sub");return `${e?texMath(e):""}_{${s?texMath(s):""}}`}
  case "m:sSubSup":{const e=pick("m:e");const s=pick("m:sub");const p=pick("m:sup");return `${e?texMath(e):""}_{${s?texMath(s):""}}^{${p?texMath(p):""}}`}
  case "m:rad":{const e=pick("m:e");const deg=pick("m:deg");const d=deg?texMath(deg).trim():"";return d?`\\sqrt[${d}]{${e?texMath(e):""}}`:`\\sqrt{${e?texMath(e):""}}`}
  case "m:d":{
   const es=kids.filter(k=>k.nodeName==="m:e");
   const pr=pick("m:dPr");
   let beg="(";let end=")";
   if(pr){
    const b=pr.getElementsByTagName("m:begChr")[0]?.getAttribute("m:val");
    const e2=pr.getElementsByTagName("m:endChr")[0]?.getAttribute("m:val");
    if(b!=null)beg=b;
    if(e2!=null)end=e2;
   }
   return `${esc(beg)}${es.map(texMath).join(",")}${esc(end)}`;
  }
  case "m:nary":{
   const pr=pick("m:naryPr");
   const chr=pr?.getElementsByTagName("m:chr")[0]?.getAttribute("m:val")||"∫";
   const map:Record<string,string>={"∑":"\\sum","∫":"\\int","∏":"\\prod","⋃":"\\bigcup","⋂":"\\bigcap","∮":"\\oint"};
   const op=map[chr]||"\\int";
   const s=pick("m:sub");const p=pick("m:sup");const e=pick("m:e");
   return `${op}${s?`_{${texMath(s)}}`:""}${p?`^{${texMath(p)}}`:""} ${e?texMath(e):""}`;
  }
  case "m:func":{const f=pick("m:fName");const e=pick("m:e");return `${f?texMath(f):""}\\left(${e?texMath(e):""}\\right)`}
  case "m:limLow":{const e=pick("m:e");const l=pick("m:lim");return `${e?texMath(e):""}_{${l?texMath(l):""}}`}
  case "m:limUp":{const e=pick("m:e");const l=pick("m:lim");return `${e?texMath(e):""}^{${l?texMath(l):""}}`}
  case "m:acc":case "m:bar":case "m:border":case "m:box":{const e=pick("m:e");return e?texMath(e):all()}
  case "m:eqArr":return kids.map(texMath).join(" \\\\ ");
  default:return all();
 }
}

type TexConverter={convert(tex:string):string|null};
let convPromise:Promise<TexConverter>|null=null;
function getConverter():Promise<TexConverter>{
 if(!convPromise)convPromise=(async()=>{
  const g=globalThis as Record<string,unknown>;
  if(g.PACKAGE_VERSION===undefined)g.PACKAGE_VERSION="3.2.1"; // versi mathjax-full; hindari eval('require') pada bundel browser
  type AnyMod=Record<string,any>;
  const pick=(m:AnyMod,name:string)=>m[name]??m.default?.[name];
  const [mj,tex,svg,ad,packs,hdl]=await Promise.all([
   import("mathjax-full/js/mathjax.js") as Promise<AnyMod>,
   import("mathjax-full/js/input/tex.js") as Promise<AnyMod>,
   import("mathjax-full/js/output/svg.js") as Promise<AnyMod>,
   import("mathjax-full/js/adaptors/liteAdaptor.js") as Promise<AnyMod>,
   import("mathjax-full/js/input/tex/AllPackages.js") as Promise<AnyMod>,
   import("mathjax-full/js/handlers/html.js") as Promise<AnyMod>
  ]);
  const adaptor=pick(ad,"liteAdaptor")();
  pick(hdl,"RegisterHTMLHandler")(adaptor);
  const doc=pick(mj,"mathjax").document("",{InputJax:new (pick(tex,"TeX"))({packages:pick(packs,"AllPackages")}),OutputJax:new (pick(svg,"SVG"))({fontCache:"local"})});
  return {convert(tex:string){
   try{
    const node=doc.convert(tex,{display:false});
    let svg=adaptor.outerHTML(node);
    const i=svg.indexOf("<svg");const j=svg.lastIndexOf("</svg>");
    if(i>=0&&j>i)svg=svg.slice(i,j+6);
    if(!svg.includes("xmlns"))svg=svg.replace("<svg",'<svg xmlns="http://www.w3.org/2000/svg"');
    return svg;
   }catch{return null}
  }};
 })();
 return convPromise;
}

type Ctx={media:Map<string,{blob:Blob;mime:string;ext:string}>;rels:Map<string,string>;images:ImportImage[];texs:{tex:string;linear:string}[]};

function imgToken(el:Element,ctx:Ctx):string{
 let rid="";
 const blips=el.getElementsByTagName("a:blip");
 if(blips.length)rid=blips[0].getAttribute("r:embed")||blips[0].getAttribute("r:id")||"";
 if(!rid){const v=el.getElementsByTagName("v:imagedata");if(v.length)rid=v[0].getAttribute("r:id")||""}
 const target=ctx.rels.get(rid);
 const entry=target?ctx.media.get(target):undefined;
 if(!entry)return "[gambar tidak terbaca]";
 const url=typeof URL.createObjectURL==="function"?URL.createObjectURL(entry.blob):`blob:img-${ctx.images.length}`;
 ctx.images.push({...entry,url});
 return `[[IMG:${ctx.images.length-1}]]`;
}

function richP(el:Element,ctx:Ctx):string{
 let out="";
 const step=(node:Node):void=>{
  if(node.nodeType===3){out+=node.textContent||"";return}
  if(node.nodeType!==1)return;
  const e=node as Element;
  switch(e.nodeName){
   case "w:t":out+=e.textContent||"";return;
   case "m:oMath":case "m:oMathPara":{ctx.texs.push({tex:texMath(e),linear:linMath(e)});out+=`[[TEX:${ctx.texs.length-1}]]`;return}
   case "w:tab":out+=" ";return;
   case "w:br":case "w:cr":out+="\n";return;
   case "w:drawing":case "w:pict":case "w:object":out+=imgToken(e,ctx);return;
   case "w:sym":return;
   default:Array.from(e.childNodes).forEach(step);
  }
 };
 step(el);
 return out;
}

function nestedTable(tbl:Element,ctx:Ctx):string{
 const trs=Array.from(tbl.childNodes).filter(n=>n.nodeType===1&&n.nodeName==="w:tr") as Element[];
 return trs.map(tr=>{
  const tcs=Array.from(tr.childNodes).filter(n=>n.nodeType===1&&n.nodeName==="w:tc") as Element[];
  return tcs.map(tc=>cellRich(tc,ctx)).join(" | ");
 }).join("\n");
}

function cellRich(tc:Element,ctx:Ctx):string{
 const parts:string[]=[];
 Array.from(tc.childNodes).forEach(n=>{
  if(n.nodeType!==1)return;
  const e=n as Element;
  if(e.nodeName==="w:p")parts.push(richP(e,ctx));
  else if(e.nodeName==="w:tbl")parts.push(nestedTable(e,ctx));
 });
 return parts.join("\n").replace(/\n{3,}/g,"\n\n").trim();
}

export function validateRow(row:number,question:string,options:string[],correctIndex:number):ImportRow{
 if(!question)return {row,question,options,correctIndex,status:"invalid",reason:"Soal kosong."};
 if(options.length<2)return {row,question,options,correctIndex,status:"invalid",reason:"Pilihan minimal 2 dan tidak boleh kosong di tengah."};
 if(options.some(o=>o.length>500))return {row,question,options,correctIndex,status:"invalid",reason:"Pilihan maksimal 500 karakter."};
 if(correctIndex<0||correctIndex>=options.length)return {row,question,options,correctIndex,status:"invalid",reason:"Kunci jawaban tidak ditandai atau di luar rentang pilihan."};
 return {row,question,options,correctIndex,status:"ok"};
}

export async function parseDocx(buf:ArrayBuffer):Promise<ImportParsed>{
 const zip=await JSZip.loadAsync(buf);
 const entry=zip.file("word/document.xml");
 if(!entry)throw new Error("bukan docx");
 const xml=await entry.async("string");
 const doc=new DOMParser().parseFromString(xml,"application/xml");
 if(doc.getElementsByTagName("parsererror").length)throw new Error("xml rusak");
 const rels=new Map<string,string>();
 const relFile=zip.file("word/_rels/document.xml.rels");
 if(relFile){
  const rx=await relFile.async("string");
  const rd=new DOMParser().parseFromString(rx,"application/xml");
  Array.from(rd.getElementsByTagName("Relationship")).forEach(r=>{
   const id=r.getAttribute("Id")||"";const target=(r.getAttribute("Target")||"").replace(/^\//,"");
   if(id&&target)rels.set(id,target);
  });
 }
 const media=new Map<string,{blob:Blob;mime:string;ext:string}>();
 for(const target of new Set(rels.values())){
  if(!/^media\//.test(target))continue;
  const f=zip.file("word/"+target);
  if(!f)continue;
  const ext=(target.split(".").pop()||"").toLowerCase();
  const mime=IMG_MIME[ext];
  if(!mime)continue;
  const u8=await f.async("uint8array");
  media.set(target,{blob:new Blob([u8.slice().buffer as ArrayBuffer],{type:mime}),mime,ext});
 }
 const ctx:Ctx={media,rels,images:[],texs:[]};
 const tables=doc.getElementsByTagName("w:tbl");
 if(!tables.length)throw new Error("tanpa tabel");
 const trs=Array.from(tables[0].childNodes).filter(n=>n.nodeType===1&&n.nodeName==="w:tr") as Element[];
 const rows:ImportRow[]=[];
 let skipped=0;
 let current:{row:number;question:string;options:string[];correctIndex:number}|null=null;
 trs.forEach((tr,i)=>{
  const tcs=Array.from(tr.childNodes).filter(n=>n.nodeType===1&&n.nodeName==="w:tc") as Element[];
  const cells=tcs.map(tc=>cellRich(tc,ctx));
  const jenis=(cells[1]||"").toUpperCase();
  if(jenis==="JENIS"||jenis==="")return;
  if(jenis==="SOAL"){
   if(current)rows.push(validateRow(current.row,current.question,current.options,current.correctIndex));
   const q=(cells[2]||"").trim();
   if(!q){current=null;skipped++;return}
   current={row:i+1,question:q,options:[],correctIndex:-1};
   return;
  }
  if(jenis==="JAWABAN"&&current){
   const o=(cells[2]||"").trim();
   if(!o)return;
   if((cells[3]||"")==="1")current.correctIndex=current.options.length;
   current.options.push(o);
  }
 });
 const last=current as {row:number;question:string;options:string[];correctIndex:number}|null;
 if(last)rows.push(validateRow(last.row,last.question,last.options,last.correctIndex));
 if(ctx.texs.length){
  const conv=await getConverter();
  ctx.texs.forEach((t,i)=>{
   const svg=conv.convert(t.tex);
   let replacement=t.linear;
   if(svg){
    const url=typeof URL.createObjectURL==="function"?URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"})):`blob:tex-${i}`;
    ctx.images.push({blob:new Blob([svg],{type:"image/svg+xml"}),mime:"image/svg+xml",ext:"svg",url});
    replacement=`[[IMG:${ctx.images.length-1}]]`;
   }
   rows.forEach(r=>{
    r.question=r.question.split(`[[TEX:${i}]]`).join(replacement);
    r.options=r.options.map(o=>o.split(`[[TEX:${i}]]`).join(replacement));
   });
  });
 }
 return {rows,skipped,images:ctx.images};
}
