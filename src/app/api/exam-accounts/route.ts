import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoUsername, nextParticipantNumbers, numberBase, randomPassword, validParticipantNumber, validUsername } from "@/lib/accounts";
export async function POST(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 let b: { examPeriodId?: unknown; studentIds?: unknown };
 try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
 if (typeof b.examPeriodId !== "string" || !b.examPeriodId) return NextResponse.json({ error: "Pilih periode ujian terlebih dahulu." }, { status: 400 });
 const period = await db.examPeriod.findUnique({ where: { id: b.examPeriodId } });
 if (!period) return NextResponse.json({ error: "Periode tidak ditemukan." }, { status: 404 });
 const raw = Array.isArray(b.studentIds) ? b.studentIds : [];
 const ids = [...new Set(raw.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 100))];
 if (!ids.length) return NextResponse.json({ error: "Pilih minimal satu peserta." }, { status: 400 });
 if (ids.length > 500) return NextResponse.json({ error: "Maksimal 500 akun per satu generasi." }, { status: 400 });
 const students = await db.student.findMany({ where: { id: { in: ids }, archivedAt: null } });
 const existingAccounts = await db.examAccount.findMany({ where: { examPeriodId: period.id }, include: { student: true } });
 const takenStudent = new Set(existingAccounts.map(a => a.studentId));
 const skipped: string[] = [];
 const fresh = students.filter(s => { if (takenStudent.has(s.id)) { skipped.push(s.name); return false; } return true });
 for (const id of ids) if (!students.some(s => s.id === id)) skipped.push(`(peserta tidak aktif)`);
 if (!fresh.length) return NextResponse.json({ error: "Semua peserta pilihan sudah memiliki akun pada periode ini.", skipped }, { status: 409 });
 const numbers = nextParticipantNumbers(numberBase(period.startDate), existingAccounts.map(a => a.participantNumber), fresh.length);
 try {
  const passwords = fresh.map(() => randomPassword());
  await db.examAccount.createMany({ data: fresh.map((s, i) => ({ examPeriodId: period.id, studentId: s.id, participantNumber: numbers[i], username: autoUsername(numbers[i]), usernameKey: autoUsername(numbers[i]), passwordHash: hashPassword(passwords[i]) })) });
  const accounts = fresh.map((s, i) => ({ studentName: s.name, participantNumber: numbers[i], username: autoUsername(numbers[i]), password: passwords[i] }));
  return NextResponse.json({ ok: true, accounts, skipped });
 } catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "Terjadi bentrok nomor/username saat menyimpan. Ulangi generasi sekali lagi." }, { status: 409 });
  console.error("Gagal membuat akun:", e);
  return NextResponse.json({ error: "Tidak dapat membuat akun." }, { status: 500 });
 }
}
export async function PATCH(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 let b: { id?: unknown; action?: unknown; participantNumber?: unknown; username?: unknown };
 try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
 if (typeof b.id !== "string" || !b.id || b.id.length > 100) return NextResponse.json({ error: "Akun tidak valid." }, { status: 400 });
 const account = await db.examAccount.findUnique({ where: { id: b.id } });
 if (!account) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
 if (b.action === "reset-password") {
  const password = randomPassword();
  await db.examAccount.update({ where: { id: account.id }, data: { passwordHash: hashPassword(password) } });
  return NextResponse.json({ ok: true, password });
 }
 if (b.action === "edit") {
  const participantNumber = typeof b.participantNumber === "string" ? validParticipantNumber(b.participantNumber) : null;
  const username = typeof b.username === "string" ? validUsername(b.username) : null;
  if (!participantNumber || !username) return NextResponse.json({ error: "Nomor peserta maksimal 20 karakter (huruf/angka/tanda hubung); username 3-32 karakter huruf kecil, angka, titik, strip." }, { status: 400 });
  try {
   await db.examAccount.update({ where: { id: account.id }, data: { participantNumber, username, usernameKey: username } });
   return NextResponse.json({ ok: true });
  } catch (e) {
   if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "Nomor peserta atau username tersebut sudah dipakai akun lain pada periode ini." }, { status: 409 });
   console.error("Gagal mengubah akun:", e);
   return NextResponse.json({ error: "Tidak dapat mengubah akun." }, { status: 500 });
  }
 }
 return NextResponse.json({ error: "Tindakan tidak valid." }, { status: 400 });
}
export async function DELETE(request: Request) {
 if (!isSameOrigin(request)) return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
 if (!(await getCurrentUser())) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
 let b: { id?: unknown };
 try { b = await request.json(); } catch { return NextResponse.json({ error: "Data tidak valid." }, { status: 400 }); }
 if (typeof b.id !== "string" || !b.id || b.id.length > 100) return NextResponse.json({ error: "Akun tidak valid." }, { status: 400 });
 const deleted = await db.examAccount.deleteMany({ where: { id: b.id } });
 if (!deleted.count) return NextResponse.json({ error: "Akun tidak ditemukan atau sudah dihapus." }, { status: 404 });
 return NextResponse.json({ ok: true });
}
