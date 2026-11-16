import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";
const db = new PrismaClient();
const hashPassword = (password) => { const salt = randomBytes(16).toString("hex"); return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`; };
const DEMO_PASSWORD = "demo12345";
const FIRST = ["Andi","Budi","Citra","Dewi","Eko","Fitri","Galih","Hana","Intan","Joko","Kartika","Lukman","Maya","Nanda","Oki","Putri","Rizky","Sari","Tono","Umi","Vina","Wawan","Yuni","Zaki"];
const LAST = ["Saputra","Wijaya","Lestari","Pratama","Ramadhan","Aisyah","Hidayat","Nursanti","Bagaskara","Melati","Kusuma","Falihin","Anggraini","Setiawan","Maharani"];
const nameKeyOf = (name) => name.normalize("NFKC").toUpperCase();
const pad = (n, w) => String(n).padStart(w, "0");
function mathItem(n) { const a = n + 3, b = n * 2; const correct = a + b; const opts = [correct, correct + 1, correct - 2, correct + 5]; return { question: `DEMO Matematika ${n}: Hasil dari ${a} + ${b} adalah …`, options: opts.map(String), correctIndex: 0 }; }
function tkjItem(n) { return { question: `DEMO Produktif TKR ${n}: Langkah pertama sebelum membongkar komponen mesin adalah …`, options: ["Memastikan mesin dingin dan kunci kontak off", "Langsung membuka blok silinder", "Menyemprotkan air ke mesin", "Menghidupkan mesin sebentar"], correctIndex: 0 }; }
function bindoItem(n) { return { question: `DEMO Bahasa Indonesia ${n}: Makna imbuhan "me-kan" pada kata "menjalankan" adalah …`, options: ["Melakukan tindakan untuk orang lain", "Menyatakan tempat", "Menyatakan waktu", "Menyatakan jumlah"], correctIndex: 0 }; }
async function main() {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1); tomorrow.setHours(7, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setHours(9, 0, 0, 0);
  const susulanStart = new Date(now); susulanStart.setDate(now.getDate() + 2); susulanStart.setHours(10, 0, 0, 0);
  const susulanEnd = new Date(susulanStart); susulanEnd.setHours(12, 0, 0, 0);
  const periodEnd = new Date(now); periodEnd.setDate(now.getDate() + 7);
  const year = await db.academicYear.upsert({ where: { label: "2026/2027" }, update: {}, create: { label: "2026/2027" } });
  const period = await db.examPeriod.upsert({ where: { id: (await db.examPeriod.findFirst({ where: { name: "DEMO Penilaian Akhir Semester Ganjil" } }))?.id || "tmp-demo-period" }, update: {}, create: { name: "DEMO Penilaian Akhir Semester Ganjil", description: "Periode data demo untuk pengujian.", semester: "GANJIL", academicYearId: year.id, startDate: tomorrow, endDate: periodEnd } });
  const deptCodes = [["AK", "Akuntansi"], ["TKJ", "Teknik Komputer & Jaringan"], ["TKR", "Teknik Kendaraan Ringan"], ["RPL", "Rekayasa Perangkat Lunak"]];
  const departments = [];
  for (const [code, name] of deptCodes) departments.push(await db.department.upsert({ where: { code }, update: {}, create: { code, name } }));
  const classrooms = [];
  for (const dept of departments) for (const grade of [10, 11]) {
    const label = grade === 10 ? "X" : "XI";
    const name = `${label} ${dept.code} 1`;
    classrooms.push(await db.classroom.upsert({ where: { academicYearId_nameKey: { academicYearId: year.id, nameKey: nameKeyOf(name) } }, update: {}, create: { name, nameKey: nameKeyOf(name), grade, academicYearId: year.id, departmentId: dept.id } }));
  }
  const students = [];
  for (let i = 0; i < 60; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}${i >= FIRST.length ? ` ${Math.floor(i / FIRST.length) + 1}` : ""}`;
    const nis = `9000${pad(i + 1, 3)}`;
    const nisn = i % 3 === 0 ? `00${pad(26000000 + i, 8)}` : null;
    students.push(await db.student.upsert({ where: { nisKey: nis }, update: {}, create: { name, nis, nisKey: nis, nisn } }));
  }
  await db.enrollment.createMany({ data: students.map((s, i) => ({ studentId: s.id, classroomId: classrooms[i % classrooms.length].id, academicYearId: year.id })), skipDuplicates: true });
  const base = `${String(period.startDate.getFullYear()).slice(2)}${pad(period.startDate.getMonth() + 1, 2)}`;
  const existingAccounts = await db.examAccount.findMany({ where: { examPeriodId: period.id } });
  let seq = existingAccounts.length;
  const accountRows = [];
  for (const s of students) {
    if (existingAccounts.some(a => a.studentId === s.id)) continue;
    seq += 1;
    const number = `${base}-${pad(seq, 4)}`;
    const username = `p${number.replace(/[^0-9a-z]/gi, "").toLowerCase()}`;
    accountRows.push({ examPeriodId: period.id, studentId: s.id, participantNumber: number, username, usernameKey: username, passwordHash: hashPassword(DEMO_PASSWORD) });
  }
  if (accountRows.length) await db.examAccount.createMany({ data: accountRows, skipDuplicates: true });
  const bankDefs = [["DEMO Bank Matematika X", "Matematika", mathItem, 12], ["DEMO Bank Produktif TKR", "Produktif TKR", tkjItem, 12], ["DEMO Bank Bahasa Indonesia", "Bahasa Indonesia", bindoItem, 10]];
  const banks = [];
  for (const [title, subject, gen, count] of bankDefs) {
    const bank = await db.questionBank.upsert({ where: { title }, update: {}, create: { title, subject, description: "Bank soal data demo." } });
    const have = await db.testItem.count({ where: { bankId: bank.id } });
    if (have === 0) {
      await db.testItem.createMany({ data: Array.from({ length: count }, (_, i) => gen(i + 1)).map((it, i) => ({ bankId: bank.id, order: i + 1, question: it.question, options: it.options, correctIndex: it.correctIndex })) });
    }
    banks.push(bank);
  }
  const test1 = await db.test.upsert({ where: { title: "DEMO Tes Produktif TKR Ganjil" }, update: {}, create: { title: "DEMO Tes Produktif TKR Ganjil", description: "Tes demo multi-bank." } });
  const test2 = await db.test.upsert({ where: { title: "DEMO Tes Matematika X" }, update: {}, create: { title: "DEMO Tes Matematika X", description: "Tes demo satu bank." } });
  await db.testBank.upsert({ where: { testId_bankId: { testId: test1.id, bankId: banks[1].id } }, update: {}, create: { testId: test1.id, bankId: banks[1].id, count: 10 } });
  await db.testBank.upsert({ where: { testId_bankId: { testId: test1.id, bankId: banks[0].id } }, update: {}, create: { testId: test1.id, bankId: banks[0].id, count: 5 } });
  await db.testBank.upsert({ where: { testId_bankId: { testId: test2.id, bankId: banks[0].id } }, update: {}, create: { testId: test2.id, bankId: banks[0].id, count: 8 } });
  let execution = await db.testExecution.findFirst({ where: { testId: test1.id, kind: "REGULER" } });
  if (!execution) execution = await db.testExecution.create({ data: { testId: test1.id, examPeriodId: period.id, kind: "REGULER", roomLabel: "Ruang 1", startAt: tomorrow, endAt: tomorrowEnd, durationMinutes: 90, shuffleQuestions: true, shuffleOptions: true } });
  let susulan = await db.testExecution.findFirst({ where: { testId: test2.id, kind: "SUSULAN" } });
  if (!susulan) susulan = await db.testExecution.create({ data: { testId: test2.id, examPeriodId: period.id, kind: "SUSULAN", roomLabel: "Ruang 1", startAt: susulanStart, endAt: susulanEnd, durationMinutes: 60, shuffleQuestions: true, shuffleOptions: false } });
  const accounts = await db.examAccount.findMany({ where: { examPeriodId: period.id } });
  await db.testAssignment.createMany({ data: accounts.slice(0, 40).map(a => ({ executionId: execution.id, studentId: a.studentId })), skipDuplicates: true });
  await db.testAssignment.createMany({ data: accounts.slice(40, 45).map(a => ({ executionId: susulan.id, studentId: a.studentId })), skipDuplicates: true });
  const samples = accounts.slice(0, 3);
  console.log("=== DATA DEMO SIAP ===");
  console.log(`Periode: ${period.name} | Tahun ajaran: ${year.label}`);
  console.log(`Kelas: ${classrooms.length} | Peserta: ${students.length} | Akun periode ini: ${accounts.length}`);
  console.log(`Bank soal: ${banks.length} | Tes: 2 | Pelaksanaan: REGULER besok 07:00-09:00 (90 mnt) + SUSULAN lusa 10:00-12:00 (60 mnt)`);
  console.log(`Login siswa demo (password semua: ${DEMO_PASSWORD}):`);
  for (const a of samples) console.log(`  - username: ${a.username} | no. peserta: ${a.participantNumber}`);
  console.log("Jalankan ulang script ini kapan saja: aman, data demo tidak akan diduplikasi.");
}
main().finally(() => db.$disconnect());
