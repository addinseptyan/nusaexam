import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import BackupManager from "./BackupManager";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 return <AdminShell>
  <PageHeader breadcrumbs={["Beranda","Pengaturan"]} title="Backup & restore" description="Salinan lengkap database aplikasi untuk antisipasi kegagalan server sekolah."/>
  <BackupManager/>
 </AdminShell>;
}
