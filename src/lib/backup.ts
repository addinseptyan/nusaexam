import fs from "fs/promises";
import path from "path";
import { db } from "./db";
/* Urutan	insert mengikuti dependensi FK; hapus memakai urutan kebalikannya. */
export const TABLE_ORDER = ["AdminUser","Session","AppSettings","AcademicYear","ExamPeriod","Department","Classroom","Student","Enrollment","ExamAccount","QuestionBank","TestItem","Test","TestBank","TestExecution","TestAssignment","StudentSession","ExamAttempt","ExamAttemptItem","FinalGrade"];
const DATE_FIELDS: Record<string, string[]> = {
 AdminUser: ["createdAt","updatedAt"], Session: ["expiresAt","createdAt"], AppSettings: ["updatedAt"],
 AcademicYear: ["createdAt","updatedAt"], ExamPeriod: ["startDate","endDate","createdAt","updatedAt"],
 Department: ["createdAt","updatedAt"], Classroom: ["createdAt","updatedAt"], Student: ["archivedAt","createdAt","updatedAt"],
 Enrollment: ["createdAt","updatedAt"], ExamAccount: ["createdAt","updatedAt"],
 QuestionBank: ["archivedAt","createdAt","updatedAt"], TestItem: ["createdAt"], Test: ["archivedAt","createdAt","updatedAt"],
 TestBank: ["createdAt"], TestExecution: ["startAt","endAt","archivedAt","createdAt","updatedAt"], TestAssignment: ["createdAt"],
 StudentSession: ["expiresAt","createdAt"], ExamAttempt: ["startedAt","endsAt","finishedAt","createdAt","updatedAt"],
 ExamAttemptItem: [], FinalGrade: ["createdAt","updatedAt"]
};
const camel = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
export const BACKUP_RE = /^nusaexam-backup-\d{8}-\d{6}\.json$/;
export function backupDir() { return process.env.BACKUP_DIR ? process.env.BACKUP_DIR : path.join(process.cwd(), "backup"); }
export async function listBackups() {
 const dir = backupDir();
 const names = await fs.readdir(dir).catch(() => [] as string[]);
 const items = [];
 for (const name of names) {
  if (!BACKUP_RE.test(name)) continue;
  const st = await fs.stat(path.join(dir, name));
  items.push({ name, size: st.size, savedAt: st.mtime.toISOString() });
 }
 return items.sort((a, b) => b.name.localeCompare(a.name));
}
export async function exportTables(client: unknown) {
 const c = client as unknown as Record<string, { findMany: () => Promise<unknown[]> }>;
 const tables: Record<string, unknown[]> = {};
 for (const t of TABLE_ORDER) tables[t] = await c[camel(t)].findMany();
 return { app: "NusaExam", version: 1, createdAt: new Date().toISOString(), tables };
}
export async function createBackup() {
 const data = await exportTables(db);
 const dir = backupDir();
 await fs.mkdir(dir, { recursive: true });
 const d = new Date();
 const pad = (n: number) => String(n).padStart(2, "0");
 const name = `nusaexam-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
 await fs.writeFile(path.join(dir, name), JSON.stringify(data));
 return name;
}
export async function restoreBackup(name: string) {
 if (!BACKUP_RE.test(name)) throw new Error("Nama berkas backup tidak valid.");
 const raw = await fs.readFile(path.join(backupDir(), name), "utf8");
 const data = JSON.parse(raw) as { app?: string; version?: number; tables?: Record<string, Record<string, unknown>[]> };
 if (data.app !== "NusaExam" || !data.tables) throw new Error("Isi berkas bukan backup NusaExam.");
 await db.$transaction(async tx => {
  const client = tx as unknown as Record<string, { deleteMany: () => Promise<unknown>; createMany: (a: { data: unknown[] }) => Promise<unknown> }>;
  for (const t of [...TABLE_ORDER].reverse()) await client[camel(t)].deleteMany();
  for (const t of TABLE_ORDER) {
   const rows = data.tables?.[t];
   if (!rows || !rows.length) continue;
   for (const r of rows) for (const f of DATE_FIELDS[t] ?? []) if (typeof r[f] === "string") r[f] = new Date(r[f] as string);
   await client[camel(t)].createMany({ data: rows });
  }
 });
 const counts = Object.entries(data.tables).reduce((a, [k, v]) => (a[k] = v.length, a), {} as Record<string, number>);
 return counts;
}
