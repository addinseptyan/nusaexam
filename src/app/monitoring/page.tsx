import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import MonitoringExecution from "./MonitoringExecution";
export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { REGULER: "Reguler", SUSULAN: "Susulan", REMIDI: "Remidi" };
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const executions=await db.testExecution.findMany({where:{archivedAt:null},include:{test:true,examPeriod:true,_count:{select:{assignments:true}}},orderBy:[{startAt:"desc"}]});
 const options=executions.map(e=>({id:e.id,label:`${e.test.title} · ${KIND[e.kind]??e.kind} · ${e.roomLabel} · ${new Date(e.startAt).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})} · ${e._count.assignments} peserta`,peserta:e._count.assignments}));
 return <AdminShell>
  <PageHeader breadcrumbs={["Beranda","Pelaksanaan & hasil"]} title="Monitoring pelaksanaan" description="Pantau progres pengerjaan peserta secara langsung per pelaksanaan."/>
  <MonitoringExecution options={options}/>
 </AdminShell>;
}
