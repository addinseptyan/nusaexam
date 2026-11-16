import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import SettingsForm from "./SettingsForm";
export const dynamic = "force-dynamic";
export default async function Page(){
 const user=await getCurrentUser();if(!user)redirect("/login");
 const s=await getSettings();
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Pengaturan"]} title="Identitas & tampilan" description="Atur nama aplikasi, identitas sekolah, dan warna dasar yang dipakai di seluruh halaman."/><SettingsForm initial={{appName:s.appName,schoolName:s.schoolName,description:s.description,primaryColor:s.primaryColor,sidebarColor:s.sidebarColor}}/></AdminShell>;
}
