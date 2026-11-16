import {redirect} from "next/navigation";
import Link from "next/link";
import {getCurrentUser} from "@/lib/auth";
import {getSettings} from "@/lib/settings";
import SettingsForm from "./SettingsForm";
export const dynamic = "force-dynamic";
export default async function Page(){const user=await getCurrentUser();if(!user)redirect("/login");const s=await getSettings();return <main className="settings-shell"><Link className="back" href="/dashboard">← Kembali ke dashboard</Link><div className="eyebrow">Pengaturan</div><h1>Identitas &amp; tampilan</h1><p className="sub">Atur nama, identitas sekolah, dan warna dasar aplikasi.</p><SettingsForm initial={{appName:s.appName,schoolName:s.schoolName,description:s.description,primaryColor:s.primaryColor,sidebarColor:s.sidebarColor}}/></main>}
