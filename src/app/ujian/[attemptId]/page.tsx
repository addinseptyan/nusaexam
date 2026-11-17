import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import RunnerUjian from "@/components/ujian/RunnerUjian";
export const dynamic = "force-dynamic";
export default async function UjianRunnerPage({params}:{params:Promise<{attemptId:string}>}){
 const st=await getCurrentStudent();
 if(!st)redirect("/ujian/login");
 const {attemptId}=await params;
 return <RunnerUjian attemptId={attemptId} studentName={st.studentName}/>;
}
