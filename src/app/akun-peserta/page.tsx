import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import AccountManager from "./AccountManager";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [periods,accounts,students,enrollments]=await Promise.all([
  db.examPeriod.findMany({include:{academicYear:true},orderBy:[{startDate:"desc"}]}),
  db.examAccount.findMany({include:{student:true},orderBy:[{participantNumber:"asc"}]}),
  db.student.findMany({orderBy:[{name:"asc"}]}),
  db.enrollment.findMany()
 ]);
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Persiapan ujian"]} title="Akun peserta" description="Buat akun ujian per periode: nomor peserta dan username otomatis atau manual, password ter-hash yang hanya ditampilkan sekali saat generasi atau reset."/><AccountManager
  periods={periods.map(p=>({id:p.id,name:p.name,academicYearId:p.academicYearId,academicYearLabel:p.academicYear.label,archived:!!p.archivedAt}))}
  accounts={accounts.map(a=>({id:a.id,examPeriodId:a.examPeriodId,studentId:a.studentId,studentName:a.student.name,participantNumber:a.participantNumber,username:a.username}))}
  students={students.map(s=>({id:s.id,name:s.name,nis:s.nis||"",archived:!!s.archivedAt}))}
  enrollments={enrollments.map(e=>({studentId:e.studentId,academicYearId:e.academicYearId}))}
 /></AdminShell>;
}
