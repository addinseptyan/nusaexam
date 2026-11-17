export default function DokumenHeader({schoolName,description,title,subtitle}:{schoolName:string;description:string;title:string;subtitle:string}){
 return <header className="mb-5 flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-3">
  <div>
   <strong className="block text-[15px] font-bold uppercase tracking-wide text-slate-900">{schoolName}</strong>
   <span className="mt-0.5 block max-w-[420px] text-[11px] leading-snug text-slate-600">{description}</span>
  </div>
  <div className="text-right">
   <strong className="block text-[13px] font-bold uppercase tracking-wide text-slate-900">{title}</strong>
   <span className="mt-0.5 block text-[11px] text-slate-600">{subtitle}</span>
  </div>
 </header>;
}
