import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import StudentManager from "./StudentManager";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const students=await db.student.findMany({orderBy:[{name:"asc"},{createdAt:"asc"}]});
 const items=students.map(s=>({id:s.id,name:s.name,nis:s.nis||"",nisn:s.nisn||"",archived:!!s.archivedAt}));
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Data sekolah"]} title="Data peserta" description="Kelola identitas induk siswa yang dapat dipakai ulang lintas periode ujian. Akun, nomor peserta, dan penempatan kelas dibuat terpisah pada tahap berikutnya."/><StudentManager students={items}/></AdminShell>;
}
