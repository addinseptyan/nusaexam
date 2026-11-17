// Backup database NusaExam tanpa HTTP (untuk Task Scheduler Windows).
// Pakai: node scripts/backup-now.mjs   (env DATABASE_URL dibaca dari .env)
import fs from "fs/promises";
import path from "path";
import { readFileSync, existsSync } from "fs";
const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath)) for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) { const m = /^([A-Z_]+)=(.*)$/.exec(line.trim()); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
const TABLE_ORDER = ["AdminUser","Session","AppSettings","AcademicYear","ExamPeriod","Department","Classroom","Student","Enrollment","ExamAccount","QuestionBank","TestItem","Test","TestBank","TestExecution","TestAssignment","StudentSession","ExamAttempt","ExamAttemptItem","FinalGrade"];
const camel = t => t.charAt(0).toLowerCase() + t.slice(1);
try {
 const tables = {};
 for (const t of TABLE_ORDER) tables[t] = await db[camel(t)].findMany();
 const dir = process.env.BACKUP_DIR ? process.env.BACKUP_DIR : path.join(process.cwd(), "backup");
 await fs.mkdir(dir, { recursive: true });
 const d = new Date(), pad = n => String(n).padStart(2, "0");
 const name = `nusaexam-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
 await fs.writeFile(path.join(dir, name), JSON.stringify({ app: "NusaExam", version: 1, createdAt: d.toISOString(), tables }));
 console.log("Backup tersimpan:", path.join(dir, name));
} finally { await db.$disconnect(); }
