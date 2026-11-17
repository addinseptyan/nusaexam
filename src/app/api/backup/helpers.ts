import fs from "fs/promises";
import path from "path";
import { BACKUP_RE, backupDir } from "@/lib/backup";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
export { createBackup, listBackups, restoreBackup } from "@/lib/backup";
export async function isSameOriginGuard(request: Request) {
 if (!isSameOrigin(request)) return false;
 return !!(await getCurrentUser());
}
export async function deleteBackup(name: string) {
 if (!BACKUP_RE.test(name)) throw new Error("Nama berkas backup tidak valid.");
 await fs.unlink(path.join(backupDir(), name));
}
