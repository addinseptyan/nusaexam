import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import LoginForm from "./LoginForm";
export const dynamic = "force-dynamic";
export default async function LoginPage(){
 if (await getCurrentUser()) redirect("/dashboard");
 const s=await getSettings();
 return <main className="login-shell" style={{"--brand":s.primaryColor,"--side":s.sidebarColor} as React.CSSProperties}>
  <section className="login-card2">
   <div className="login-brand"><span className="login-logo"><Sparkles size={18}/></span><span className="login-brand-copy"><strong>{s.appName}</strong><small>{s.description}</small></span></div>
   <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Selamat datang kembali</h1>
   <p className="mt-1 text-[13px] text-slate-500">Masuk sebagai administrator untuk melanjutkan.</p>
   <LoginForm/>
   <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-400"><span>{s.schoolName}<br/>Tahap pengembangan · bukan untuk ujian sesungguhnya</span><Link className="font-semibold text-slate-500 hover:text-slate-700" href="/ujian/login">Login peserta</Link></div>
  </section>
 </main>;
}
