# NusaExam — login admin dan pengaturan dasar

**Masih tahap pengembangan; belum siap dipakai untuk ujian atau data asli.** Sudah tersedia login admin pertama, dashboard awal, serta pengaturan nama sekolah/aplikasi dan dua warna dasar. Belum tersedia peserta, soal, sesi, ujian, rekap, backup, atau kontrol keamanan lengkap seperti pembatasan percobaan login. Belum ada pengujian menyeluruh menggunakan PostgreSQL di Windows.

## Memperbarui fondasi yang sudah ada

Salin isi paket ke folder proyek, tetapi jangan menimpa atau menghapus file `.env` Anda. Pastikan koneksi mengarah ke database **pengembangan**, bukan database produksi. Pastikan cadangan jika database sudah memuat data. Selanjutnya jalankan:

```sh
npm ci
npm run db:generate
npm run db:check
npm run db:migrate:deploy
npm run admin:create
npm run dev
```

Buka http://localhost:3000; alamat yang tepat ditampilkan di terminal. `db:migrate:deploy` menerapkan migrasi awal pada database. `admin:create` hanya membuat admin pertama ketika tabel admin masih kosong. Password minimal 12 karakter dan tidak ditampilkan. Jangan menaruh password dalam Git, chat, maupun skrip.

Buka `/pengaturan` setelah login. Warna putih pada tombol dan sidebar belum diperiksa otomatis kontrasnya, gunakan warna cukup gelap. Logo/kop serta pengaturan lain menyusul.

## Environment

Untuk instalasi baru, copy `.env.example` menjadi `.env` dan isi `DATABASE_URL`. Password pada URL harus di-encode bila berisi karakter khusus. Buat database dan akun PostgreSQL khusus aplikasi, tidak menggunakan akun superuser untuk aplikasi. File `.env` jangan di-commit.

Cookie `secure` hanya aktif jika `COOKIE_SECURE=true` di environment. Pada development HTTP localhost, default-nya false. HTTP LAN tidak mengenkripsi password atau data; rencanakan HTTPS dan penguatan keamanan sebelum dipakai sungguhan. Pembatasan login, pengelolaan akun, audit, restore dan pengetesan belum lengkap.

## Git dan server

Jangan unggah `.env`, data siswa, soal asli, backup, media privat atau kredensial ke GitHub. Repository private tetap perlu perlindungan rahasia. Server dan komputer development harus memakai database dan `.env` terpisah. Instal dependensi dengan `npm ci` pada masing-masing mesin; jangan memindahkan `node_modules`. Belum ada panduan deployment produksi: jangan pasang tahap ini untuk ujian sungguhan.

## Data demo & impor (pengembangan)

- `npm run db:seed-demo` mengisi database pengembangan dengan data demo idempoten: tahun ajaran 2026/2027, periode DEMO PAS Ganjil, 4 jurusan, 8 kelas, 60 peserta, penempatan kelas, akun peserta (password seragam `demo12345`), 3 bank soal berisi soal DEMO, 2 tes berkomposisi multi-bank, pelaksanaan REGULER (besok 07:00-09:00, 90 menit) dan SUSULAN (lusa 10:00-12:00, 60 menit) beserta penugasannya. Aman dijalankan berulang; tidak menduplikasi data. Username contoh dicetak di akhir script.
- Impor peserta: halaman Peserta → Impor Excel (template .xlsx tersedia di dialog).
- Impor soal: halaman Bank soal & tes → pilih bank → Impor Word (.docx). Template 50 soal (kolom No merge vertikal, 5 pilihan jawaban, sel kuning tidak perlu diisi) tersedia di dialog; baris soal yang kosong otomatis dilewati. Rumus/simbol matematika (OMML) dikonversi menjadi TeX lalu dirender MathJax (mathjax-full, dibundel lokal) menjadi gambar SVG; tabel bersarang dibaca menjadi baris teks; gambar dan SVG rumus disimpan server ke folder media (env MEDIA_DIR, bawaan <app>/media/items) dan disajikan lewat /api/media/items. Teks soal menyimpan markdown ![gambar](url) atau URL polos (data lama); komponen shared/RichText merender keduanya sebagai gambar di daftar soal dan nanti di halaman ujian.
- Jangan jalankan seeder pada database produksi; password demo bersifat publik.

## Pelaksanaan ujian siswa
- Login peserta di /ujian/login (sesi cookie terpisah); daftar ujian hanya yang ditugaskan server ke siswa tersebut.
- Durasi dihitung dari jam mulai terjadwal dan dipotong akhir jendela: endsAt = min(startAt + durasi, endAt). Siswa telat mendapat sisa waktu sampai endsAt; lewat endsAt tidak bisa mulai (susulan lewat operator).
- Snapshot soal per siswa (ExamAttemptItem) memuat urutan/acak pilihan dan kunci; autosave per pilihan; tanda ragu-ragu tersimpan; waktu habis dikumpulkan otomatis; nilai otomatis = benar/total x 100 (nilai akhir ditetapkan guru).
- Monitoring (/monitoring): tabel live per pelaksanaan (polling 8 dtk) — status peserta, progres soal, tanda ragu-ragu, sisa menit, nilai; attempt kedaluwarsa dinonaktifkan otomatis saat dipantau.
- Rekap hasil (/hasil): nilai otomatis per jenis (reguler/susulan/remidi), hasil utama = reguler, selain itu susulan dengan bendera nilai valid ganda, absen tampil kosong.

## Dokumen cetak (/cetak)
Enam dokumen siap cetak berkepala sekolah dari Pengaturan: daftar peserta, kartu login (password kosong, diserahkan terpisah), daftar hadir, berita acara (ringkasan kehadiran otomatis + tabel kejadian), jadwal per periode, dan pengumuman & tata tertib. Halaman cetak bersih dari menu operator; tombol Cetak/PDF menyembunyikan diri saat print.

## Nilai akhir, backup, dan load test
- Rekap hasil (/hasil) menyediakan kolom nilai akhir guru (0-100, tersimpan per tes & peserta) di samping nilai otomatis.
- Backup & restore (/backup): berkas JSON seluruh tabel di folder backup/ (env BACKUP_DIR); restore menyeluruh dengan konfirmasi. Backup terjadwal tanpa login: Task Scheduler Windows menjalankan `node scripts/backup-now.mjs` (mis. harian 21:00: schtasks /Create /TN NusaExamBackup /SC DAILY /ST 21:00 /TR "node C:\NusaExam\app\scripts\backup-now.mjs").
- Load test: `node scripts/loadtest.mjs http://localhost:3000 p2601-0001,p2601-0002,... demo12345 10` mensimulasikan login, mulai ujian, autosave tiap soal, dan selesai secara konkuren; melaporkan p50/p95 latensi autosave. Sasaran sekolah: 40 PC simultan nyaman bila p95 autosave < 300 ms pada build produksi (`npm run build` lalu `npm start`).
