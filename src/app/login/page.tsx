import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import LoginForm from "./LoginForm";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
 if (await getCurrentUser()) redirect("/dashboard");
 const settings = await getSettings();
 return <main className="login-wrap"><section className="login-card"><div className="brand"><span className="mark">✳</span><span>{settings.appName}<small>{settings.description}</small></span></div><h1>Selamat datang kembali.</h1><p className="sub">Masuk sebagai administrator untuk melanjutkan.</p><LoginForm color={settings.primaryColor}/><div className="foot">{settings.schoolName}<br/>Tahap pengembangan · bukan untuk ujian sesungguhnya</div></section></main>;
}
