import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import AcademicManager from "./AcademicManager";
export const dynamic="force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [years,departments,classrooms,settings]=await Promise.all([
  db.academicYear.findMany({orderBy:{label:"desc"}}),db.department.findMany({orderBy:{code:"asc"}}),
  db.classroom.findMany({include:{academicYear:true,department:true},orderBy:[{academicYear:{label:"desc"}},{grade:"asc"},{name:"asc"}]}),getSettings()
 ]);
 return <main className="settings-shell wide"><Link className="back" href="/dashboard">← Kembali ke dashboard</Link><div className="eyebrow">Data sekolah</div><h1>Kelas &amp; jurusan</h1><p className="sub">Siapkan kelompok kelas per tahun ajaran untuk data peserta nanti.</p><AcademicManager color={settings.primaryColor} years={years.map(y=>({id:y.id,label:y.label}))} departments={departments.map(d=>({id:d.id,code:d.code,name:d.name,archived:!!d.archivedAt}))} classrooms={classrooms.map(c=>({id:c.id,name:c.name,grade:c.grade,academicYearId:c.academicYearId,academicYearLabel:c.academicYear.label,departmentId:c.departmentId,departmentCode:c.department.code,archived:!!c.archivedAt}))}/></main>
}
