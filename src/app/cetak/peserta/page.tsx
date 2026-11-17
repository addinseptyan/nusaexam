import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import DokumenHeader from "@/components/cetak/DokumenHeader";
import CetakBar from "@/components/cetak/CetakBar";
export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { REGULER: "Reguler", SUSULAN: "Susulan", REMIDI: "Remidi" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
 const user = await getCurrentUser();
 if (!user) redirect("/login");
 const sp = await searchParams;
 const exec = await db.testExecution.findUnique({ where: { id: sp.executionId || "" }, include: { test: true, examPeriod: { include: { academicYear: true } }, assignments: { include: { student: { include: { enrollments: { include: { classroom: true } }, examAccounts: true } } } } } });
 if (!exec) redirect("/cetak");
 const s = await getSettings();
 const rows = exec.assignments.map(a => {
  const acc = a.student.examAccounts.find(x => x.examPeriodId === exec.examPeriodId);
  const enr = a.student.enrollments.find(e => e.academicYearId === exec.examPeriod.academicYearId);
  return { number: acc?.participantNumber ?? "—", username: acc?.username ?? "—", name: a.student.name, className: enr?.classroom.name ?? "—" };
 }).sort((a, b) => a.number.localeCompare(b.number, "id"));
 return <main className="cetak-shell">
  <CetakBar label="Daftar peserta"/>
  <article className="cetak-doc">
   <DokumenHeader schoolName={s.schoolName} description={s.description} title="Daftar Peserta Ujian" subtitle={`${exec.test.title} · ${KIND[exec.kind] ?? exec.kind} · ${exec.examPeriod.name} · ${exec.examPeriod.academicYear.label}`}/>
   <p className="mb-3">Ruang {exec.roomLabel} · {new Date(exec.startAt).toLocaleString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} – {new Date(exec.endAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · durasi {exec.durationMinutes} menit · {rows.length} peserta.</p>
   <table>
    <thead><tr><th style={{ width: 34 }}>No</th><th style={{ width: 110 }}>No. Peserta</th><th>Nama Peserta</th><th style={{ width: 130 }}>Kelas</th><th style={{ width: 130 }}>Username</th><th style={{ width: 120 }}>Keterangan</th></tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.name + i}><td>{i + 1}</td><td>{r.number}</td><td>{r.name}</td><td>{r.className}</td><td>{r.username}</td><td></td></tr>)}</tbody>
   </table>
   <p className="mt-2 text-[10.5px] text-slate-500">Password tidak dicantumkan pada dokumen ini sesuai kebijakan keamanan aplikasi.</p>
   <div className="mt-8 flex justify-end"><div className="text-center"><span>Dicetak {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span><span className="block">Operator,</span><span className="block h-16"></span><span className="block font-bold underline">({user.username})</span></div></div>
  </article>
 </main>;
}
