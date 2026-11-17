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
 const exec = await db.testExecution.findUnique({ where: { id: sp.executionId || "" }, include: { test: true, examPeriod: true, assignments: true, attempts: { include: { items: true } } } });
 if (!exec) redirect("/cetak");
 const s = await getSettings();
 const now = new Date();
 const effEnd = new Date(Math.min(exec.startAt.getTime() + exec.durationMinutes * 60000, exec.endAt.getTime()));
 const hadir = exec.attempts.length;
 const selesai = exec.attempts.filter(a => a.status === "SELESAI").length;
 const total = exec.assignments.length;
 return <main className="cetak-shell">
  <CetakBar label="Berita acara"/>
  <article className="cetak-doc">
   <DokumenHeader schoolName={s.schoolName} description={s.description} title="Berita Acara Pelaksanaan Ujian" subtitle={`${exec.test.title} · ${KIND[exec.kind] ?? exec.kind} · Ruang ${exec.roomLabel}`}/>
   <p className="mb-3">Pada hari ini {new Date(exec.startAt).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}, pukul {new Date(exec.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} s.d. {new Date(exec.endAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}, telah dilaksanakan ujian {exec.test.title} jenis {KIND[exec.kind] ?? exec.kind} pada periode {exec.examPeriod.name} dengan ringkasan sebagai berikut:</p>
   <table className="mb-4" style={{ width: "70%" }}>
    <tbody>
     <tr><th style={{ width: 220 }}>Peserta terdaftar</th><td>{total} peserta</td></tr>
     <tr><th>Peserta hadir / memulai pengerjaan</th><td>{hadir} peserta</td></tr>
     <tr><th>Peserta menyelesaikan ujian</th><td>{selesai} peserta</td></tr>
     <tr><th>Peserta tidak hadir</th><td>{now > effEnd ? `${Math.max(0, total - hadir)} peserta` : "menunggu pelaksanaan berakhir"}</td></tr>
     <tr><th>Waktu pengerjaan efektif</th><td>{exec.durationMinutes} menit dari jam mulai, berakhir {effEnd.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td></tr>
    </tbody>
   </table>
   <p className="mb-2">Catatan kejadian selama pelaksanaan (diisi operator):</p>
   <table>
    <thead><tr><th style={{ width: 34 }}>No</th><th style={{ width: 90 }}>Waktu</th><th>Kejadian / kendala</th><th style={{ width: 200 }}>Penanganan</th></tr></thead>
    <tbody>{[1, 2, 3, 4, 5].map(n => <tr key={n}><td>{n}</td><td style={{ height: 34 }}></td><td></td><td></td></tr>)}</tbody>
   </table>
   <p className="mt-4">Demikian berita acara ini dibuat berdasarkan keadaan sebenarnya selama pelaksanaan ujian berbasis komputer di {s.schoolName} untuk dipergunakan sebagaimana mestinya.</p>
   <div className="mt-8 grid grid-cols-2 gap-10 text-center">
    <div><span>Operator pelaksanaan,</span><span className="block h-16"></span><span className="block font-bold underline">({user.username})</span></div>
    <div><span>Mengetahui, Ketua Panitia Ujian,</span><span className="block h-16"></span><span className="block font-bold underline">(…………………………)</span></div>
   </div>
  </article>
 </main>;
}
