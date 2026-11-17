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
 const period = await db.examPeriod.findUnique({ where: { id: sp.periodId || "" }, include: { academicYear: true, executions: { where: { archivedAt: null }, include: { test: true, _count: { select: { assignments: true } } }, orderBy: { startAt: "asc" } } } });
 if (!period) redirect("/cetak");
 const s = await getSettings();
 return <main className="cetak-shell">
  <CetakBar label="Jadwal pelaksanaan"/>
  <article className="cetak-doc">
   <DokumenHeader schoolName={s.schoolName} description={s.description} title="Jadwal Pelaksanaan Ujian" subtitle={`${period.name} · ${period.academicYear.label} · ${new Date(period.startDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} s.d. ${new Date(period.endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`}/>
   <table>
    <thead><tr><th style={{ width: 34 }}>No</th><th style={{ width: 150 }}>Hari / Tanggal</th><th style={{ width: 110 }}>Waktu</th><th style={{ width: 70 }}>Durasi</th><th>Tes</th><th style={{ width: 80 }}>Jenis</th><th style={{ width: 90 }}>Ruang</th><th style={{ width: 70 }}>Peserta</th></tr></thead>
    <tbody>{period.executions.map((e, i) => <tr key={e.id}><td>{i + 1}</td><td>{new Date(e.startAt).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</td><td>{new Date(e.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} – {new Date(e.endAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td><td>{e.durationMinutes} mnt</td><td>{e.test.title}</td><td>{KIND[e.kind] ?? e.kind}</td><td>{e.roomLabel}</td><td>{e._count.assignments}</td></tr>)}</tbody>
   </table>
   <p className="mt-3 text-[10.5px] text-slate-500">Durasi dihitung sejak jam mulai terjadwal; peserta yang terlambat masuk hanya memperoleh sisa waktu hingga batas berakhirnya pengerjaan.</p>
   <div className="mt-8 flex justify-end"><div className="text-center"><span>Dicetak {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span><span className="block">Operator,</span><span className="block h-16"></span><span className="block font-bold underline">({user.username})</span></div></div>
  </article>
 </main>;
}
