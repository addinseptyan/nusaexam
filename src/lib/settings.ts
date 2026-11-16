import { db } from "./db";
export const defaults = { appName: "NusaExam", schoolName: "SMKS Nusantara Banyuwangi", description: "Sistem ujian sekolah", primaryColor: "#236b55", sidebarColor: "#17343a" };
export async function getSettings() { return (await db.appSettings.findUnique({ where: { id: 1 } })) ?? defaults; }
