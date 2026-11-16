import { randomBytes } from "node:crypto";
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function randomPassword(length = 10) {
 for (let attempt = 0; attempt < 20; attempt++) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  if (/[a-z]/.test(out) && /[0-9]/.test(out)) return out;
 }
 return "ganti-sesaat1";
}
export function numberBase(periodStart: Date) {
 const y = String(periodStart.getFullYear()).slice(2);
 const m = String(periodStart.getMonth() + 1).padStart(2, "0");
 return `${y}${m}`;
}
export function nextParticipantNumbers(base: string, existing: string[], count: number) {
 const re = new RegExp(`^${base}-(\\d{4})$`);
 let max = 0;
 for (const n of existing) { const m = re.exec(n); if (m) max = Math.max(max, Number(m[1])); }
 const out: string[] = [];
 for (let i = 1; i <= count; i++) out.push(`${base}-${String(max + i).padStart(4, "0")}`);
 return out;
}
export function autoUsername(participantNumber: string) {
 return `p${participantNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
}
export function validParticipantNumber(value: string) {
 const v = value.trim().toUpperCase();
 return /^[A-Z0-9-]{1,20}$/.test(v) ? v : null;
}
export function validUsername(value: string) {
 const v = value.trim().toLowerCase();
 return /^[a-z0-9._-]{3,32}$/.test(v) ? v : null;
}
