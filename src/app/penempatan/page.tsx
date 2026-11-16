import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import EnrollmentManager from "./EnrollmentManager";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [years,classrooms,students,enrollments]=await Promise.all([
  db.academicYear.findMany({orderBy:{label:"desc"}}),
  db.classroom.findMany({include:{department:true,academicYear:true},orderBy:[{academicYear:{label:"desc"}},{grade:"asc"},{name:"asc"}]}),
  db.student.findMany({orderBy:[{name:"asc"}]}),
  db.enrollment.findMany({include:{student:true,classroom:{include:{department:true}},academicYear:true},orderBy:[{academicYear:{label:"desc"}},{classroom:{name:"asc"}},{student:{name:"asc"}}]})
 ]);
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Data sekolah"]} title="Penempatan kelas" description="Tempatkan peserta ke kelas pada tahun ajaran tertentu. Satu peserta hanya dapat memiliki satu kelas per tahun ajaran; penempatan tahun lalu tetap tersimpan sebagai riwayat."/><EnrollmentManager
  years={years.map(y=>({id:y.id,label:y.label}))}
  classrooms={classrooms.map(c=>({id:c.id,name:c.name,grade:c.grade,departmentCode:c.department.code,academicYearId:c.academicYearId,academicYearLabel:c.academicYear.label,archived:!!c.archivedAt}))}
  students={students.map(s=>({id:s.id,name:s.name,nis:s.nis||"",archived:!!s.archivedAt}))}
  enrollments={enrollments.map(e=>({id:e.id,studentId:e.studentId,studentName:e.student.name,studentNis:e.student.nis||"",studentArchived:!!e.student.archivedAt,classroomId:e.classroomId,className:e.classroom.name,departmentCode:e.classroom.department.code,academicYearId:e.academicYearId,academicYearLabel:e.academicYear.label}))}
 /></AdminShell>;
}
