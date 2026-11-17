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
 const period = await db.examPeriod.findUnique({ where: { id: sp.periodId || "" }, include: { academicYear: true, executions: { where: { archivedAt: null }, include: { test: true }, orderBy: { startAt: "asc" } } } });
 if (!period) redirect("/cetak");
 const s = await getSettings();
 return <main className="cetak-shell">
  <CetakBar label="Pengumuman"/>
  <article className="cetak-doc">
   <DokumenHeader schoolName={s.schoolName} description={s.description} title="Pengumuman & Tata Tertib Ujian" subtitle={`${period.name} · ${period.academicYear.label}`}/>
   <p className="mb-3">Diumumkan kepada seluruh peserta ujian {s.schoolName} bahwa pelaksanaan ujian berbasis komputer periode {period.name} akan berlangsung sesuai jadwal terlampir. Setiap peserta wajib mematuhi ketentuan berikut:</p>
   <ol className="mb-4 list-decimal pl-5 text-[12px] leading-relaxed">
    <li>Hadir di ruang ujian selambat-lambatnya 15 menit sebelum jam mulai dan menempati tempat yang ditentukan pengawas.</li>
    <li>Membawa kartu login peserta; username dan password bersifat pribadi dan tidak dibagikan kepada siapa pun.</li>
    <li>Waktu pengerjaan dihitung sejak jam mulai terjadwal. Peserta yang terlambat tetap dapat masuk selama waktu belum berakhir, namun hanya memperoleh sisa waktu (tidak ada perpanjangan, kecuali izin tercatat dari operator).</li>
    <li>Jawaban tersimpan otomatis setiap kali pilihan diklik; periksa tanda centang pada navigasi soal sebelum mengakhiri ujian.</li>
    <li>Dilarang bekerja sama, menggunakan berkas luar, atau membuka aplikasi lain selama ujian; pelanggaran dicatat pada berita acara.</li>
    <li>Kendala teknis (perangkat, jaringan, listrik) segera dilaporkan kepada pengawas; kejadian akan dicatat dan ditangani sesuai berita acara.</li>
    <li>Ujian susulan dan remidi hanya diikuti peserta yang terdaftar pada pelaksanaan terkait.</li>
   </ol>
   <table>
    <thead><tr><th style={{ width: 34 }}>No</th><th style={{ width: 150 }}>Hari / Tanggal</th><th style={{ width: 110 }}>Waktu</th><th>Tes</th><th style={{ width: 80 }}>Jenis</th><th style={{ width: 90 }}>Ruang</th></tr></thead>
    <tbody>{period.executions.map((e, i) => <tr key={e.id}><td>{i + 1}</td><td>{new Date(e.startAt).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</td><td>{new Date(e.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} – {new Date(e.endAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td><td>{e.test.title}</td><td>{KIND[e.kind] ?? e.kind}</td><td>{e.roomLabel}</td></tr>)}</tbody>
   </table>
   <p className="mt-4">Demikian pengumuman ini disampaikan untuk dilaksanakan dengan penuh tanggung jawab.</p>
   <div className="mt-8 flex justify-end"><div className="text-center"><span>Ketua Panitia Ujian,</span><span className="block h-16"></span><span className="block font-bold underline">(…………………………)</span></div></div>
  </article>
 </main>;
}
