import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import DokumenHeader from "@/components/cetak/DokumenHeader";
import CetakBar from "@/components/cetak/CetakBar";
export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { REGULER: "Reguler", SUSULAN: "Susulan", REMIDI: "Remidi" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
 if (!(await getCurrentUser())) redirect("/login");
 const sp = await searchParams;
 const exec = await db.testExecution.findUnique({ where: { id: sp.executionId || "" }, include: { examPeriod: { include: { academicYear: true } }, assignments: { include: { student: { include: { enrollments: { include: { classroom: true } }, examAccounts: true } } } } } });
 if (!exec) redirect("/cetak");
 const s = await getSettings();
 const execs = await db.testExecution.findMany({ where: { examPeriodId: exec.examPeriodId, archivedAt: null }, include: { test: true }, orderBy: { startAt: "asc" } });
 const cards = exec.assignments.map(a => {
  const acc = a.student.examAccounts.find(x => x.examPeriodId === exec.examPeriodId);
  const enr = a.student.enrollments.find(e => e.academicYearId === exec.examPeriod.academicYearId);
  return { id: a.student.id, name: a.student.name, number: acc?.participantNumber ?? "—", username: acc?.username ?? "—", className: enr?.classroom.name ?? "—" };
 }).sort((a, b) => a.number.localeCompare(b.number, "id"));
 return <main className="cetak-shell">
  <CetakBar label="Kartu login"/>
  <article className="cetak-doc">
   <DokumenHeader schoolName={s.schoolName} description={s.description} title="Kartu Login Peserta" subtitle={`${exec.examPeriod.name} · ${exec.examPeriod.academicYear.label} · gunting mengikuti garis putus-putus`}/>
   <div className="grid grid-cols-2 gap-5">
    {cards.map((c, i) => <div key={c.id} className={`print-avoid rounded-md border border-dashed border-slate-400 p-3 ${i >= 2 ? "" : ""}`}>
     <strong className="block text-[11px] font-bold uppercase tracking-wide text-slate-800">{s.schoolName}</strong>
     <span className="block text-[10px] text-slate-500">Kartu login ujian · {exec.examPeriod.name}</span>
     <div className="mt-2 grid gap-0.5 text-[11.5px]">
      <span><b>Nama</b>: {c.name}</span>
      <span><b>Kelas</b>: {c.className}</span>
      <span><b>No. peserta</b>: {c.number}</span>
      <span><b>Username</b>: {c.username}</span>
      <span><b>Password</b>: ……………… (diserahkan terpisah)</span>
     </div>
     <div className="mt-2 border-t border-slate-200 pt-1.5 text-[10px] leading-snug text-slate-600">
      {execs.length === 0 ? <span>Belum ada jadwal pada periode ini.</span> : execs.map(e => <span key={e.id} className="block">{new Date(e.startAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} {new Date(e.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {e.test.title} ({KIND[e.kind] ?? e.kind}) · {e.roomLabel}</span>)}
     </div>
    </div>)}
   </div>
   <p className="mt-4 text-[10.5px] text-slate-500">Password dicetak kosong pada kartu dan diserahkan terpisah sekali saat pembagian akun; peserta dapat meminta reset kepada operator bila terlupa.</p>
  </article>
 </main>;
}
