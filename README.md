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
