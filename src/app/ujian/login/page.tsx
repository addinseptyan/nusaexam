import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getCurrentStudent } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import LoginSiswa from "@/components/ujian/LoginSiswa";
export const dynamic = "force-dynamic";
export default async function UjianLoginPage(){
 if (await getCurrentStudent()) redirect("/ujian");
 const s=await getSettings();
 return <main className="login-shell" style={{"--brand":s.primaryColor,"--side":s.sidebarColor} as React.CSSProperties}>
  <section className="login-card2">
   <div className="login-brand"><span className="login-logo"><GraduationCap size={18}/></span><span className="login-brand-copy"><strong>{s.appName}</strong><small>{s.description}</small></span></div>
   <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Login peserta ujian</h1>
   <p className="mt-1 text-[13px] text-slate-500">Gunakan username dan password akun ujian periode ini (tercantum pada kartu login Anda).</p>
   <LoginSiswa/>
   <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-400"><span>{s.schoolName}</span><Link className="font-semibold text-slate-500 hover:text-slate-700" href="/login">Login operator</Link></div>
  </section>
 </main>;
}
