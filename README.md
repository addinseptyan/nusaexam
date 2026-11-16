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
