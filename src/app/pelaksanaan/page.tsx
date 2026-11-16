import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import ExecutionManager from "./ExecutionManager";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [executions,assignments,accounts,students,tests,periods]=await Promise.all([
  db.testExecution.findMany({include:{test:true,examPeriod:{include:{academicYear:true}},_count:{select:{assignments:true}}},orderBy:[{startAt:"desc"}]}),
  db.testAssignment.findMany({include:{student:true},orderBy:{student:{name:"asc"}}}),
  db.examAccount.findMany(),
  db.student.findMany({orderBy:{name:"asc"}}),
  db.test.findMany({where:{archivedAt:null},orderBy:{title:"asc"}}),
  db.examPeriod.findMany({include:{academicYear:true},orderBy:{startDate:"desc"}})
 ]);
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Soal & tes"]} title="Pelaksanaan tes" description="Jadwalkan satu tes menjadi pelaksanaan reguler, susulan, atau remidi dengan jendela waktu, durasi, ruang, dan daftar peserta tersendiri."/><ExecutionManager
  executions={executions.map(e=>({id:e.id,testId:e.testId,testTitle:e.test.title,examPeriodId:e.examPeriodId,periodName:`${e.examPeriod.name} (${e.examPeriod.academicYear.label})`,kind:e.kind,roomLabel:e.roomLabel,startAt:e.startAt.toISOString(),endAt:e.endAt.toISOString(),durationMinutes:e.durationMinutes,assignedCount:e._count.assignments,shuffleQuestions:e.shuffleQuestions,shuffleOptions:e.shuffleOptions,archived:!!e.archivedAt}))}
  assignments={assignments.map(a=>({id:a.id,executionId:a.executionId,studentId:a.studentId,studentName:a.student.name}))}
  accounts={accounts.map(a=>({examPeriodId:a.examPeriodId,studentId:a.studentId}))}
  students={students.filter(s=>!s.archivedAt).map(s=>({id:s.id,name:s.name}))}
  tests={tests.map(t=>({id:t.id,title:t.title}))}
  periods={periods.filter(p=>!p.archivedAt).map(p=>({id:p.id,name:p.name,academicYearLabel:p.academicYear.label}))}
 /></AdminShell>;
}
