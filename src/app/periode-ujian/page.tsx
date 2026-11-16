import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import PeriodManager from "./PeriodManager";
export const dynamic = "force-dynamic";
export default async function PeriodePage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [years, periods, settings] = await Promise.all([
    db.academicYear.findMany({ orderBy: { label: "desc" } }),
    db.examPeriod.findMany({ include: { academicYear: true }, orderBy: [{ startDate: "desc" }, { createdAt: "desc" }] }),
    getSettings(),
  ]);
  const items = periods.map(p => ({ id: p.id, name: p.name, description: p.description, semester: p.semester, academicYearId: p.academicYearId, academicYearLabel: p.academicYear.label, startDate: p.startDate.toISOString().slice(0,10), endDate: p.endDate.toISOString().slice(0,10), archived: Boolean(p.archivedAt) }));
  return <main className="settings-shell wide"><Link className="back" href="/dashboard">← Kembali ke dashboard</Link><div className="eyebrow">Administrasi ujian</div><h1>Periode ujian</h1><p className="sub">Atur tahun ajaran dan periode kegiatan sebelum menyusun jadwal.</p><PeriodManager years={years.map(y=>({id:y.id,label:y.label}))} periods={items} color={settings.primaryColor}/></main>;
}
