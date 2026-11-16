import { Fragment } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
export function PageHeader({breadcrumbs,title,description,children}:{breadcrumbs:string[];title:string;description?:string;children?:React.ReactNode}){
 return <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
  <div className="min-w-0">
   <Breadcrumb><BreadcrumbList>{breadcrumbs.map((b,i)=><Fragment key={b}>{i>0&&<BreadcrumbSeparator/>}<BreadcrumbItem>{i===0?<BreadcrumbLink href="/dashboard">{b}</BreadcrumbLink>:<span className="text-slate-400">{b}</span>}</BreadcrumbItem></Fragment>)}<BreadcrumbSeparator/><BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
   <h1 className="mt-1.5 text-[26px] font-bold tracking-tight text-slate-900">{title}</h1>
   {description&&<p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">{description}</p>}
  </div>
  {children&&<div className="flex flex-wrap items-center gap-2">{children}</div>}
 </div>;
}
