import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";
import { Writable } from "node:stream";
const db = new PrismaClient();
let muted = false;
const output = new Writable({ write(chunk, _encoding, callback) { if (!muted) process.stdout.write(chunk); callback(); } });
const rl = readline.createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
function ask(prompt, secret = false) { return new Promise(resolve => { if (secret) { process.stdout.write(prompt); muted = true; rl.question("", ans => { muted = false; process.stdout.write("\n"); resolve(ans); }); } else rl.question(prompt, resolve); }); }
try {
 if (!process.stdin.isTTY) throw new Error("Jalankan perintah ini di terminal interaktif.");
 if (await db.adminUser.count()) throw new Error("Administrator sudah ada. Skrip ini hanya untuk membuat admin pertama.");
 const username = String(await ask("Username admin (3–50 huruf kecil, angka, titik, _ atau -): ")).trim().toLowerCase();
 if (!/^[a-z0-9._-]{3,50}$/.test(username)) throw new Error("Format username tidak valid.");
 const password = String(await ask("Password admin (minimal 12 karakter; tidak ditampilkan): ", true));
 const confirmation = String(await ask("Ulangi password: ", true));
 if (password.length < 12 || password.length > 256 || password !== confirmation) throw new Error("Password minimal 12 karakter, maksimal 256 karakter, dan kedua input harus sama.");
 const salt = randomBytes(16).toString("hex");
 const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
 await db.adminUser.create({ data: { username, passwordHash } });
 console.log("Administrator pertama berhasil dibuat.");
} catch (e) { console.error("Gagal membuat admin:", e.message); process.exitCode = 1; }
finally { rl.close(); await db.$disconnect(); }
