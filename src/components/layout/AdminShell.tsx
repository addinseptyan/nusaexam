import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
export async function AdminShell({children}:{children:React.ReactNode}){
 const user=await getCurrentUser(); if(!user)redirect("/login");
 const s=await getSettings();
 return <div className="nusa-shell" style={{"--brand":s.primaryColor,"--side":s.sidebarColor} as React.CSSProperties}>
  <Sidebar appName={s.appName} schoolName={s.schoolName}/>
  <div className="nusa-main">
   <header className="nusa-topbar"><div><span className="top-kicker">RUANG ADMINISTRASI</span><strong>{s.schoolName}</strong></div><UserMenu username={user.username}/></header>
   <div className="nusa-content">{children}</div>
  </div>
 </div>;
}
