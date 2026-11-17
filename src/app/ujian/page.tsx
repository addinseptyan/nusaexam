import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import DaftarUjian from "@/components/ujian/DaftarUjian";
export const dynamic = "force-dynamic";
export default async function UjianPage(){
 const st=await getCurrentStudent();
 if(!st)redirect("/ujian/login");
 const s=await getSettings();
 return <DaftarUjian studentName={st.studentName} periodName={st.periodName} appName={s.appName} schoolName={s.schoolName}/>;
}
