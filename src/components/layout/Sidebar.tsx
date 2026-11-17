"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, GraduationCap, UsersRound, Settings2, Sparkles, DoorOpen, Timer, BookOpen, Activity, Printer, School, KeyRound ,ClipboardList,DatabaseBackup} from "lucide-react";
const groups = [
 {label:"Menu utama",items:[{href:"/dashboard",label:"Dashboard",icon:LayoutDashboard}]},
 {label:"Data sekolah",items:[{href:"/periode-ujian",label:"Periode ujian",icon:CalendarDays},{href:"/kelas-jurusan",label:"Kelas & jurusan",icon:GraduationCap},{href:"/peserta",label:"Peserta",icon:UsersRound},{href:"/penempatan",label:"Penempatan kelas",icon:School}]},
 {label:"Persiapan ujian",items:[{href:"/akun-peserta",label:"Akun peserta",icon:KeyRound}]},
 {label:"Soal & tes",items:[{href:"/bank-soal",label:"Bank soal & tes",icon:BookOpen},{href:"/pelaksanaan",label:"Pelaksanaan tes",icon:Timer}]},
 {label:"Pelaksanaan & hasil",items:[{href:"/monitoring",label:"Monitoring",icon:Activity},{href:"/hasil",label:"Rekap hasil",icon:ClipboardList},{href:"/cetak",label:"Dokumen cetak",icon:Printer}]},
 {label:"Pengaturan",items:[{href:"/pengaturan",label:"Tampilan & identitas",icon:Settings2},{href:"/backup",label:"Backup & restore",icon:DatabaseBackup}]},
];
const soon = [
 {label:"Ruang ujian",icon:DoorOpen},
 {label:"Sesi & penempatan",icon:Timer},
 {label:"Monitoring ujian",icon:Activity},
 {label:"Rekap & dokumen cetak",icon:Printer},
];
export default function Sidebar({appName,schoolName}:{appName:string;schoolName:string}){
 const path=usePathname();
 const navRef=useRef<HTMLElement>(null);
 useEffect(()=>{const el=navRef.current;if(!el)return;const saved=Number(sessionStorage.getItem("nusa-sidebar-scroll")||"0");if(saved>0)el.scrollTop=saved;},[]);
 return <aside className="nusa-sidebar" aria-label="Navigasi utama" ref={navRef} onScroll={e=>{sessionStorage.setItem("nusa-sidebar-scroll",String(e.currentTarget.scrollTop))}}>
  <div className="side-brand"><span className="side-logo"><Sparkles size={19}/></span><span className="side-brand-copy"><strong>{appName}</strong><small>{schoolName}</small></span></div>
  <nav>
   {groups.map(group=><div key={group.label} className="side-group"><div className="side-label">{group.label}</div>{group.items.map(item=>{const active=path===item.href||path.startsWith(item.href+"/");const Icon=item.icon;return <Link className={`side-link${active?" is-active":""}`} href={item.href} key={item.href} aria-current={active?"page":undefined} title={item.label}><Icon size={18} strokeWidth={1.8}/><span>{item.label}</span></Link>})}</div>)}
   <div className="side-group"><div className="side-label">Tahap berikutnya</div>{soon.map(item=>{const Icon=item.icon;return <span className="side-link is-soon" key={item.label} aria-disabled="true" title={`${item.label} — segera`}><Icon size={18} strokeWidth={1.8}/><span>{item.label}</span></span>})}</div>
  </nav>
  <div className="side-footer"><span className="side-dot"/><span>Versi pengembangan</span></div>
 </aside>;
}
