import { Toaster } from "sonner";
import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "NusaExam", description: "Sistem ujian sekolah berbasis jaringan lokal" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<Toaster position="top-right" richColors closeButton /></body></html>;
}
