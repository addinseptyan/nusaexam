import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import CetakPicker from "./CetakPicker";
export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { REGULER: "Reguler", SUSULAN: "Susulan", REMIDI: "Remidi" };
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [executions,periods]=await Promise.all([
  db.testExecution.findMany({where:{archivedAt:null},include:{test:true,examPeriod:true,_count:{select:{assignments:true}}},orderBy:[{startAt:"desc"}]}),
  db.examPeriod.findMany({where:{archivedAt:null},include:{academicYear:true},orderBy:[{startDate:"desc"}]})
 ]);
 return <AdminShell>
  <PageHeader breadcrumbs={["Beranda","Pelaksanaan & hasil"]} title="Dokumen cetak" description="Dokumen siap cetak dengan kepala sekolah dari pengaturan: daftar peserta, kartu login, absensi, jadwal, pengumuman, dan berita acara."/>
  <CetakPicker
   executions={executions.map(e=>({id:e.id,label:`${e.test.title} · ${KIND[e.kind]??e.kind} · ${new Date(e.startAt).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})} · ${e._count.assignments} peserta`}))}
   periods={periods.map(p=>({id:p.id,label:`${p.name} · ${p.academicYear.label}`}))}
  />
 </AdminShell>;
}
