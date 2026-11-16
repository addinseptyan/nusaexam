import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import PeriodManager from "./PeriodManager";
export const dynamic = "force-dynamic";
export default async function PeriodePage(){
 if(!(await getCurrentUser()))redirect("/login");
 const [years,periods]=await Promise.all([
  db.academicYear.findMany({orderBy:{label:"desc"}}),
  db.examPeriod.findMany({include:{academicYear:true},orderBy:[{startDate:"desc"},{createdAt:"desc"}]})
 ]);
 const items=periods.map(p=>({id:p.id,name:p.name,description:p.description,semester:p.semester,academicYearId:p.academicYearId,academicYearLabel:p.academicYear.label,startDate:p.startDate.toISOString().slice(0,10),endDate:p.endDate.toISOString().slice(0,10),archived:Boolean(p.archivedAt)}));
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Administrasi ujian"]} title="Periode ujian" description="Atur tahun ajaran dan periode kegiatan ujian sebelum menyusun jadwal, peserta, dan sesi."/><PeriodManager years={years.map(y=>({id:y.id,label:y.label}))} periods={items}/></AdminShell>;
}
