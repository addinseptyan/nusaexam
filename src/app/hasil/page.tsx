import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import RekapHasil from "./RekapHasil";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const tests=await db.test.findMany({where:{archivedAt:null},orderBy:{createdAt:"desc"}});
 return <AdminShell>
  <PageHeader breadcrumbs={["Beranda","Pelaksanaan & hasil"]} title="Rekap hasil ujian" description="Nilai otomatis per jenis pelaksanaan; hasil utama gabungan reguler dan susulan."/>
  <RekapHasil options={tests.map(t=>({value:t.id,label:t.title}))}/>
 </AdminShell>;
}
