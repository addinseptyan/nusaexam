import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import StudentManager from "./StudentManager";
export const dynamic = "force-dynamic";
export default async function Page() {
 if (!(await getCurrentUser())) redirect("/login");
 const [students, settings] = await Promise.all([db.student.findMany({ orderBy: [{ name: "asc" }, { createdAt: "asc" }] }), getSettings()]);
 const items = students.map(s => ({id:s.id,name:s.name,nis:s.nis||"",nisn:s.nisn||"",archived:!!s.archivedAt}));
 return <main className="settings-shell wide"><Link className="back" href="/dashboard">← Kembali ke dashboard</Link><div className="eyebrow">Data sekolah</div><h1>Data induk peserta</h1><p className="sub">Kelola identitas siswa yang dapat digunakan kembali pada periode ujian berikutnya.</p><StudentManager students={items} color={settings.primaryColor}/></main>;
}
