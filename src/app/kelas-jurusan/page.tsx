import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import AcademicManager from "./AcademicManager";
export const dynamic="force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [years,departments,classrooms]=await Promise.all([
  db.academicYear.findMany({orderBy:{label:"desc"}}),db.department.findMany({orderBy:{code:"asc"}}),
  db.classroom.findMany({include:{academicYear:true,department:true},orderBy:[{academicYear:{label:"desc"}},{grade:"asc"},{name:"asc"}]})
 ]);
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Data sekolah"]} title="Kelas & jurusan" description="Siapkan jurusan dan kelompok kelas per tahun ajaran sebagai dasar penempatan peserta dan penyusunan jadwal."/><AcademicManager years={years.map(y=>({id:y.id,label:y.label}))} departments={departments.map(d=>({id:d.id,code:d.code,name:d.name,archived:!!d.archivedAt}))} classrooms={classrooms.map(c=>({id:c.id,name:c.name,grade:c.grade,academicYearId:c.academicYearId,academicYearLabel:c.academicYear.label,departmentId:c.departmentId,departmentCode:c.department.code,archived:!!c.archivedAt}))}/></AdminShell>;
}
