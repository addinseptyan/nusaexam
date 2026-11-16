# Product Requirements Document (PRD)

# NusaExam

**Sistem ujian berbasis jaringan lokal**  
**Instansi awal:** SMKS Nusantara Banyuwangi  
**Versi dokumen:** 1.0 — rancangan awal  
**Tanggal:** 16 November 2026  
**Status:** Draft kerja; kebutuhan dan prioritas masih dapat disempurnakan selama pengembangan.

---

## 1. Ringkasan produk

NusaExam adalah aplikasi ujian berbasis web untuk membantu sekolah mengelola administrasi dan pelaksanaan ujian melalui jaringan lokal (LAN). Aplikasi ditujukan untuk berjalan pada satu komputer server sekolah dan diakses oleh sekitar 25–40 komputer peserta secara bersamaan, ditambah beberapa pengguna pengelola.

Aplikasi tidak membutuhkan hosting internet untuk pelaksanaan ujian. Namun, internet dapat diperlukan selama pengembangan, pengunduhan dependensi, pembaruan, atau pengelolaan repository GitHub.

### Tujuan utama

1. Menyiapkan administrasi ujian hingga dokumen siap dicetak dan diumumkan.
2. Menyelenggarakan ujian pilihan ganda sesuai jadwal tetap.
3. Mengelola ujian reguler, susulan, dan remidi dari satu definisi tes tanpa membuat ulang tes.
4. Mendukung sesi campuran yang berisi sebagian siswa dari beberapa kelas atau jurusan.
5. Menyediakan penyimpanan jawaban yang andal, pemulihan gangguan, monitoring, dan rekap hasil.
6. Menyediakan fondasi yang dapat berkembang ke soal esai dan audio pada tahap selanjutnya.

---

## 2. Kondisi dan batasan awal

### Infrastruktur server

- Windows 10 Pro 64-bit, build 19045.
- Intel Core i5-2500.
- RAM 8 GB.
- SSD SATA sekitar 224 GB.
- Node.js v26.13.1 dan npm v11.20.0 telah dilaporkan terpasang pada server.
- PostgreSQL telah dilaporkan terpasang pada server.
- Server dan komputer peserta menggunakan jaringan lokal sekolah.

### Lingkungan pengembangan

- Komputer pengembangan menggunakan Windows 11.
- PostgreSQL sudah terpasang di komputer pengembangan.
- Pengembangan dilakukan pada komputer lain, kemudian kode direncanakan diunggah ke GitHub dan di-clone ke server sekolah.
- Database pengembangan harus terpisah dari database server ujian.

### Kondisi ruang

- Saat ini sekolah memiliki satu ruang ujian yang digunakan bergantian karena keterbatasan komputer.
- Desain data sebaiknya tetap mendukung beberapa ruang pada masa depan.
- Kapasitas server dan jaringan harus dibuktikan dengan simulasi; spesifikasi di atas bukan jaminan kemampuan produksi.

### Dukungan sistem operasi

Dukungan standar Windows 10 telah berakhir. Sekolah perlu memeriksa cakupan pembaruan perangkat, mengamankan jaringan, dan merencanakan migrasi ke sistem operasi yang masih didukung bila memungkinkan.

---

## 3. Pengguna dan peran

| Peran | Kebutuhan utama |
|---|---|
| Administrator | Pengaturan aplikasi, akun pengelola, hak akses, dan operasional sistem. |
| Panitia/operator | Mengatur periode, peserta, jadwal, sesi, penempatan ruang, dokumen, dan monitoring. |
| Guru/pembuat soal | Mengelola bank soal dan tes sesuai kewenangan; melihat hasil dan menetapkan nilai akhir. |
| Peserta | Login dengan akun periode, melihat tes yang ditugaskan, dan mengerjakan ujian. |

**Aturan:** hak akses harus diperiksa di server, bukan hanya dengan menyembunyikan menu. Pemisahan dan rincian hak akses final ditetapkan sebelum fitur tiap peran dirilis.

---

## 4. Istilah dan model utama

| Istilah | Pengertian |
|---|---|
| Periode ujian | Kegiatan ujian, misalnya semester ganjil, yang mencakup peserta dan pelaksanaan ujian. |
| Peserta induk | Identitas siswa yang dapat digunakan kembali pada periode berikutnya. |
| Akun periode | Kredensial peserta untuk satu periode ujian. Dibuat baru pada periode berikutnya. |
| Bank soal | Kumpulan soal berdasarkan mata pelajaran/topik. |
| Tes | Definisi ujian yang dibuat sekali dan dapat digunakan pada pelaksanaan reguler, susulan, dan remidi. |
| Pelaksanaan | Penggunaan suatu tes untuk jenis, jadwal, pengaturan soal, dan peserta tertentu. |
| Slot ruang/sesi | Rentang penggunaan ruang untuk membagi peserta dan mengelola kapasitas serta nomor meja. |
| Penugasan | Hubungan peserta dengan pelaksanaan yang boleh diikuti. |
| Percobaan | Catatan pengerjaan satu peserta pada satu pelaksanaan, termasuk jawaban dan hasil. |
| Snapshot | Salinan versi soal dan kunci yang digunakan agar riwayat ujian tetap konsisten. |

**Prinsip desain:** satu tes → banyak pelaksanaan reguler/susulan/remidi → penugasan dan hasil tersimpan terpisah.

---

## 5. Kebutuhan fungsional

### 5.1 Pengaturan aplikasi dan identitas sekolah

Administrator dapat mengatur:

- Nama aplikasi dan deskripsi/tagline.
- Nama sekolah, logo, alamat, kontak, dan identitas tambahan yang diperlukan.
- Nama yayasan dan identitas penandatangan, bila diperlukan.
- Kop sekolah dan informasi bawaan pada dokumen cetak.
- Tahun ajaran, semester, nama periode/kegiatan ujian, dan deskripsinya.
- Petunjuk ujian, tata tertib, informasi berita acara, dan pesan setelah selesai.
- Pengaturan bawaan seperti penggunaan token, pengacakan, serta kebijakan tampilan hasil.
- Format nomor peserta dan username otomatis, termasuk awalan, tahun-bulan, pemisah, dan panjang minimum nomor urut.
- Warna utama dan warna sidebar; sediakan palet bawaan, pratinjau, serta pemulihan warna bawaan.

Warna status seperti sukses, peringatan, dan kesalahan harus tetap mudah dibedakan. Pemeriksaan kontras otomatis dan opsi tema lain perlu dirancang serta diuji sebelum dianggap selesai.

Pengaturan yang bersifat sensitif atau teknis—misalnya kredensial database dan lokasi penyimpanan—ditangani melalui konfigurasi server yang aman, bukan form yang dapat diakses seluruh pengguna.

**Prioritas pengaturan:** pengaturan pelaksanaan → pengaturan periode → pengaturan umum. Riwayat dan dokumen yang sudah diterbitkan tidak boleh berubah diam-diam akibat perubahan pengaturan global; mekanisme snapshot dokumen final perlu ditentukan.

### 5.2 Peserta dan kelas

- Mengelola peserta induk, kelas, dan jurusan.
- Menambah dan memperbarui peserta secara manual.
- Mengimpor peserta dari template Excel dengan pratinjau dan laporan kesalahan per baris.
- Mencari dan memfilter peserta berdasarkan nama, kelas, jurusan, dan nomor.
- Mengaktifkan atau menonaktifkan peserta tanpa menghapus riwayat.
- Identitas seperti NIS/NISN bersifat opsional sesuai kebutuhan sekolah.

### 5.3 Akun dan identitas peserta per periode

- Username dan password baru dibuat untuk setiap periode ujian; peserta induk tetap sama.
- Nomor peserta ujian dan username **masing-masing** dapat dipilih otomatis atau custom.
- Nomor peserta ujian disimpan sebagai teks dan berbeda dari NIS/NISN.
- Format otomatis mencakup tahun dan bulan pembuatan sesuai zona waktu aplikasi serta nomor urut, misalnya `P-202611-00001` dan `U-202611-00001`.
- Tahun-bulan saja tidak cukup menjamin keunikan: sistem harus memiliki alokasi nomor urut dan constraint database yang aman terhadap pembuatan bersamaan.
- Nomor dan username custom diperiksa terhadap nomor yang sudah digunakan dan duplikat dalam impor. Username diperiksa tanpa membedakan huruf besar/kecil.
- Nomor/username lama yang telah digunakan tidak digunakan ulang; detail normalisasi dan kebijakan perubahan identitas setelah cetak harus difinalisasi saat desain database.
- Pratinjau tidak menjamin nomor sudah dicadangkan; nomor final ditetapkan ketika penyimpanan berhasil.
- Password dibuat dengan mekanisme aman dan disimpan dalam bentuk hash.
- Rekomendasi awal: password ditampilkan sekali saat dibuat untuk langsung dicetak. Jika hilang, admin membuat ulang password; password lama tidak dapat dibaca kembali dan menjadi tidak berlaku setelah reset.
- Reset massal memerlukan konfirmasi. Dokumen berisi password hanya dibagikan secara terbatas, tidak ditempel di papan pengumuman.

### 5.4 Ruang, sesi campuran, dan nomor meja

- Mengelola ruang dan kapasitas komputer/tempat duduk.
- Membuat slot penggunaan ruang dengan tanggal, waktu, dan kapasitas.
- Membagi **sebagian peserta** dari beberapa kelas/jurusan ke satu sesi.
- Menyediakan pembagian otomatis acak, otomatis dengan upaya sebaran kelas, dan manual.
- Pengacakan pembagian sesi dan pengacakan nomor meja dapat diatur secara terpisah.
- Menampilkan pratinjau sebelum pembagian disimpan.
- Admin dapat memindahkan atau menukar peserta dan mengubah nomor meja.
- Hasil pembagian yang disimpan tidak berubah setiap halaman dibuka.
- Perubahan setelah ujian dimulai harus dibatasi dan dicatat, serta tidak menghapus jawaban atau hasil yang ada.
- Validasi kapasitas menghitung semua penggunaan ruang yang waktunya tumpang tindih; validasi juga mencegah benturan peserta dan nomor meja.

### 5.5 Jadwal dan pelaksanaan ujian

- Mengelola periode, mata pelajaran, tes, tanggal, waktu mulai, waktu selesai, dan ruang.
- Sesi bersifat dinamis sesuai jumlah mapel, kelas, dan jurusan.
- Slot ruang dapat berisi beberapa pelaksanaan berbeda, termasuk jenis reguler, susulan, dan remidi yang berlangsung bersamaan.
- Setiap pelaksanaan memiliki jam mulai dan selesai masing-masing. Pelaksanaan yang ditempatkan pada suatu slot harus berada dalam rentang slot tersebut.
- Sistem memeriksa benturan waktu peserta, nomor meja, dan kapasitas ruang sebelum jadwal diterbitkan atau perubahan disimpan.
- Status jadwal/pelaksanaan mencakup setidaknya draft, diterbitkan, dan dibatalkan; rincian status akhir perlu disepakati saat implementasi.
- Penggunaan token bersifat dapat dikonfigurasi.

### 5.6 Bank soal dan tes

**Cakupan awal:** pilihan ganda dengan satu jawaban benar.

- Mengelola mata pelajaran, topik, soal, pilihan jawaban, dan kunci.
- Mendukung gambar pada soal.
- Mendukung bobot soal dan status draft/siap digunakan.
- Mengimpor soal melalui template Excel dengan validasi dan pratinjau.
- Memilih soal secara manual atau berdasarkan topik sesuai rancangan pelaksanaan.
- Mengacak urutan soal dan pilihan jawaban bila diaktifkan; urutan yang diterima peserta tetap sama setelah refresh/login ulang.
- Memvalidasi jumlah soal, kunci, jadwal, peserta, dan media sebelum penerbitan.
- Menyimpan snapshot soal dan kunci saat pelaksanaan diterbitkan atau pada tahap penerbitan yang disepakati.

Untuk susulan dan remidi, admin dapat memilih:

1. Menggunakan **butir soal yang sama persis** dengan paket/pelaksanaan acuan; urutan dapat diacak bila diatur.
2. Mengambil ulang dari **bank soal yang sama**, berdasarkan kriteria yang dipilih.

Jika setiap peserta pada pelaksanaan acuan memiliki set soal berbeda, acuan tepat untuk opsi “sama persis” harus dipilih secara eksplisit pada desain akhir; sistem tidak boleh menebak paket acuan.

### 5.7 Ujian reguler, susulan, dan remidi

- Admin membuat tes satu kali, lalu membuat satu atau lebih pelaksanaan untuk tiap jenis.
- Admin dapat membuat susulan dari tes dan memilih kandidat berdasarkan status atau secara manual.
- Admin dapat membuat remidi dari hasil dan memilih kandidat berdasarkan nilai atau secara manual.
- Hasil filter merupakan bantuan; keputusan peserta final tetap dikonfirmasi admin.
- Pembuatan susulan/remidi sebaiknya melalui beberapa langkah sederhana tanpa memilih ulang bank soal dari awal, kecuali admin ingin mengubahnya.
- Susulan dan remidi dapat berlangsung bersamaan dalam ruang yang sama selama kapasitas dan jadwal tidak berbenturan.
- Nilai reguler, susulan, dan remidi disimpan terpisah dan tidak saling menimpa.

### 5.8 Penugasan dan tampilan peserta

Peserta hanya boleh melihat dan mengakses pelaksanaan yang ditugaskan kepadanya. Server memeriksa:

- Akun periode aktif dan sesuai.
- Peserta terdaftar pada pelaksanaan.
- Pelaksanaan telah diterbitkan.
- Jadwal dan status pengerjaan memungkinkan akses.
- Token valid, jika diaktifkan.

Peserta dari berbagai kelas dan jenis pelaksanaan boleh berada pada sesi/ruang yang sama, tetapi hanya melihat tes yang sesuai untuk dirinya. Mengakses URL secara langsung tidak boleh melewati pemeriksaan server.

### 5.9 Pengerjaan dan waktu ujian

- Dashboard peserta menampilkan tes yang ditugaskan dan statusnya.
- Peserta dapat memulai ujian, menavigasi soal, menjawab, menandai soal untuk ditinjau, dan menyelesaikan ujian dengan konfirmasi.
- Jawaban dikirim dan disimpan secara otomatis, disertai status menyimpan, tersimpan, atau gagal.
- Penyimpanan sementara di browser dan pengiriman ulang saat jaringan pulih dapat digunakan sebagai cadangan, tetapi bukan jaminan jawaban diterima.
- Server menjadi sumber utama waktu, status, dan jawaban yang telah terkonfirmasi tersimpan.
- **Waktu mengikuti jadwal tetap:** peserta terlambat hanya memperoleh sisa waktu sampai jam selesai pelaksanaannya, bukan durasi penuh sejak mulai.
- Sebelum jam mulai, peserta tidak dapat memulai. Setelah batas akhir, server menolak perubahan jawaban sesuai aturan yang ditetapkan; jawaban yang sudah tersimpan tetap digunakan.
- Peserta yang browser-nya tertutup dapat melanjutkan jika penugasan dan waktunya masih berlaku.
- Pengelolaan percobaan, pengiriman ulang, dan jawaban ganda dirancang agar tidak menciptakan duplikasi atau menimpa jawaban terbaru dengan data lama.
- Operator berwenang dapat memberikan tambahan waktu individual dengan alasan dan audit log. Batas waktu peserta diperbarui.

### 5.10 Monitoring dan intervensi

- Menampilkan peserta per pelaksanaan, ruang, dan sesi.
- Menampilkan status peserta, jumlah soal dijawab, batas waktu, dan waktu komunikasi terakhir.
- Waktu komunikasi terakhir tidak boleh diklaim sebagai bukti bahwa peserta sedang aktif.
- Operator berwenang dapat mereset sesi login, membantu masuk kembali, menambah waktu, dan menangani ujian sesuai kebijakan.
- Tindakan penting dicatat bersama identitas pengelola, waktu, dan alasan jika diperlukan.

### 5.11 Hasil, rekap, dan nilai akhir

- Nilai pilihan ganda dihitung berdasarkan jawaban dan snapshot kunci yang digunakan.
- Aturan bobot, pembulatan, nilai salah/kosong, dan tampilan hasil dapat dikonfigurasi sesuai kebutuhan.
- Rekap tersedia untuk reguler, susulan, dan remidi secara terpisah.
- **Rekap gabungan reguler + susulan** menampilkan satu hasil ujian utama untuk setiap peserta beserta sumbernya.
  - Jika hanya ada satu hasil reguler yang sah, gunakan hasil reguler.
  - Jika tidak ada hasil reguler yang sah dan ada satu hasil susulan yang sah, gunakan hasil susulan.
  - Jika ada beberapa hasil yang sama-sama berpotensi digunakan, tandai untuk dipilih guru; jangan memilih secara diam-diam.
  - Peserta yang belum memiliki hasil ditampilkan dengan status dan nilai kosong, bukan otomatis nol.
  - Nilai remidi tidak otomatis dimasukkan ke hasil utama gabungan ini.
- Guru menentukan nilai akhir secara manual dan dapat memberi catatan. Riwayat perubahan dan identitas pengubah dicatat.
- Rekap dapat difilter berdasarkan periode, tes, mata pelajaran, kelas, jurusan, dan jenis pelaksanaan, lalu diekspor ke Excel.

### 5.12 Dokumen administrasi

Dokumen dapat dicetak sesuai data dan filter:

1. Jadwal umum ujian, per kelas, dan per ruang.
2. Jadwal khusus atau gabungan untuk reguler, susulan, dan remidi.
3. Jadwal per peserta.
4. Daftar peserta per slot ruang/sesi, termasuk gabungan beberapa tes.
5. Daftar peserta per pelaksanaan tes.
6. Label nomor meja dan daftar/denah tempat duduk sederhana.
7. Kartu peserta.
8. Kartu login yang bersifat rahasia.
9. Daftar hadir.
10. Berita acara pelaksanaan.
11. Tata tertib dan petunjuk ujian.

Nama peserta boleh ditampilkan pada pengumuman. Password tidak boleh disertakan dalam dokumen yang ditempel untuk umum. Template cetak sebaiknya menggunakan kop dan identitas yang dapat dikonfigurasi. Hasil cetak harus diuji pada printer sekolah.

### 5.13 Backup, pemulihan, dan operasional

- Menyediakan atau mendokumentasikan backup database dan media soal.
- Menyimpan salinan backup di perangkat terpisah dari server.
- Melakukan uji restore database dan media ke lingkungan uji.
- Memantau ruang disk, jam server, dan status backup.
- Menyiapkan prosedur restart setelah gangguan listrik dan kebijakan penambahan waktu.
- Server dan perangkat jaringan utama idealnya menggunakan UPS.
- File media disimpan di luar folder build dan ikut dalam backup.

---

## 6. Kebutuhan nonfungsional

### 6.1 Kapasitas dan performa

- Target pengujian awal: setidaknya 40 peserta aktif bersamaan serta beberapa pengelola.
- Uji login, mulai, penyimpanan jawaban, navigasi, dan penyelesaian bersamaan di jaringan sekolah.
- Pantau CPU, RAM, disk, waktu respons, dan error; batas kinerja kuantitatif ditetapkan setelah pengukuran awal.

### 6.2 Keandalan

- Jawaban yang telah dikonfirmasi tersimpan harus dapat dimuat kembali.
- Server memvalidasi akses, waktu, dan status ujian.
- Uji browser tertutup, koneksi putus, restart server, dan pemulihan backup.
- Penyimpanan browser bersifat cadangan terbatas; server mati bukan berarti aplikasi dapat berfungsi sepenuhnya secara offline.

### 6.3 Keamanan dan privasi

- Gunakan hash password, sesi yang aman, dan hak akses di server.
- Tambahkan perlindungan terhadap percobaan login berulang, validasi input, perlindungan terhadap permintaan lintas situs, dan audit tindakan.
- Batasi akses database ke server atau pihak yang memang membutuhkan; jangan membuka port database untuk siswa.
- Batasi akses dan masa simpan file backup, kartu login, dan data peserta.
- Hindari data asli siswa, soal rahasia, password, file `.env`, sertifikat, dan backup di repository publik.
- HTTP di LAN tidak mengenkripsi kredensial atau jawaban. Evaluasi HTTPS lokal dengan sertifikat tepercaya sebelum penggunaan sesungguhnya.
- Jangan membuka port aplikasi ke internet tanpa rancangan dan pengamanan khusus.

### 6.4 Penggunaan tanpa internet

- Login dan seluruh alur inti ujian harus dapat berjalan dengan server dan LAN aktif meskipun internet mati.
- Font, skrip, gaya, dan media yang dibutuhkan saat ujian harus tersedia lokal.
- Instalasi paket, GitHub, dan pembaruan dapat memerlukan internet di luar masa ujian.

---

## 7. Rekomendasi teknologi

| Komponen | Rancangan |
|---|---|
| Aplikasi | Next.js dengan TypeScript. |
| Database | PostgreSQL pada server lokal. |
| Akses database | Prisma ORM dan migrasi yang ditinjau. |
| UI | CSS lokal; Tailwind atau komponen lain dapat ditambahkan bila disepakati. |
| Media | Folder lokal terpisah dari build aplikasi. |
| Impor/ekspor | Library spreadsheet `.xlsx` setelah dipilih dan ditinjau. |
| Cetak | Halaman HTML dengan CSS cetak; PDF sisi server dapat dipertimbangkan kemudian. |
| Version control | Git lokal dan repository GitHub publik untuk kode yang telah dibersihkan dari data sensitif. |
| Pengujian | Unit, integrasi, browser, simulasi gangguan dan beban. |

Redis, Docker, WebSocket, dan microservices belum menjadi kebutuhan awal. Node dan dependency harus diuji pada komputer pengembangan dan server; versi dalam lockfile perlu dijaga dan diperbarui secara terkontrol.

---

## 8. Cakupan dan prioritas

### Cakupan rilis awal yang ditargetkan

- Akun dan peran pengelola.
- Pengaturan sekolah dan tema.
- Periode, peserta, kelas/jurusan, dan akun peserta per periode.
- Nomor peserta/username otomatis maupun custom.
- Ruang, sesi campuran, jadwal, penempatan, dan nomor meja.
- Dokumen administrasi utama dan cetak.
- Bank soal pilihan ganda, gambar, dan impor Excel.
- Tes reguler, susulan, remidi, pengacakan, dan penugasan.
- Pengerjaan terjadwal, autosave, pemulihan sesi, dan monitoring.
- Rekap dan nilai akhir manual.
- Backup/restore, pengamanan, serta pengujian operasional.

### Tahap lanjutan

- Soal esai dan penilaian manual per jawaban.
- Soal audio/listening.
- Analisis butir soal yang telah disepakati rumusnya.
- Impor soal Word, jika masih diperlukan.
- Penyempurnaan template dokumen dan fitur lain berdasarkan penggunaan.

Struktur data perlu memungkinkan jenis soal dan media tambahan tanpa menyatakan fitur tersebut sudah tersedia.

---

## 9. Status implementasi saat dokumen dibuat

| Bagian | Status |
|---|---|
| Koneksi database pengembangan | Pengguna melaporkan pemeriksaan koneksi berhasil. |
| Login admin, dashboard awal, pengaturan nama dan dua warna | Pengguna melaporkan tahap awal berhasil dijalankan. |
| Pengaturan lanjutan, logo, kop, dan kontras otomatis | Belum diimplementasikan pada tahap awal. |
| Peserta, jadwal, sesi, soal, ujian, rekap, dan dokumen | Belum diimplementasikan pada tahap awal. |
| Keamanan lengkap, backup/restore, pengujian beban dan deployment produksi | Belum selesai; wajib sebelum penggunaan sebenarnya. |

Pernyataan berhasil dijalankan bukan pengganti audit keamanan, uji integrasi menyeluruh, atau simulasi ujian nyata.

---

## 10. Tahapan implementasi

1. **Fondasi:** proyek, database, login admin, dashboard awal, dan pengaturan dasar.
2. **Data sekolah:** periode, kelas/jurusan, peserta induk, akun periode, nomor otomatis/custom.
3. **Administrasi:** ruang, slot dan sesi campuran, nomor meja, jadwal, dokumen cetak.
4. **Bank soal dan tes:** pilihan ganda, impor, pengaturan pelaksanaan dan snapshot.
5. **Pengerjaan ujian:** penugasan, waktu server, autosave dan pemulihan.
6. **Monitoring dan hasil:** intervensi operator, rekap, dan nilai akhir guru.
7. **Operasional:** keamanan, backup/restore, produksi, simulasi 40 peserta, dan dokumentasi.
8. **Lanjutan:** esai, audio, dan analisis lebih lanjut.

Tahap dapat dikerjakan secara bertahap, tetapi aplikasi baru boleh dipakai untuk ujian sebenarnya setelah kebutuhan minimum operasional dan pengujiannya terpenuhi.

---

## 11. Kriteria penerimaan utama

1. Admin membuat susulan/remidi dari tes yang sudah ada tanpa membuat tes baru.
2. Admin dapat memilih soal sama persis atau mengambil ulang dari bank yang sama; versi soal/kunci yang digunakan terlacak.
3. Peserta yang berhak hanya melihat dan dapat mengakses tes yang ditugaskan.
4. Sesi campuran dapat berisi sebagian peserta dari beberapa kelas, tanpa benturan kapasitas atau nomor meja.
5. Beberapa pelaksanaan termasuk susulan dan remidi dapat berjalan bersamaan pada ruang yang sama selama validasi lolos.
6. Peserta terlambat memperoleh sisa waktu sampai batas akhir pelaksanaannya.
7. Jawaban yang dikonfirmasi tersimpan tetap ada setelah login ulang; kegagalan penyimpanan ditampilkan dengan jelas.
8. Nomor peserta dan username otomatis maupun custom divalidasi unik, termasuk saat pembuatan bersamaan.
9. Rekap reguler, susulan, remidi, dan gabungan reguler + susulan tersedia, dengan kasus ambigu ditandai untuk guru.
10. Guru dapat menetapkan nilai akhir tanpa menghapus nilai percobaan sebelumnya.
11. Dokumen publik dapat menampilkan nama dan nomor meja tetapi tidak menampilkan password.
12. Simulasi 40 peserta dan uji gangguan serta restore backup berhasil dalam kondisi sekolah sebelum ujian nyata.

---

## 12. Keputusan yang masih perlu difinalisasi

- Detail peran dan batas akses guru/operator, termasuk siapa yang dapat melihat atau mengubah soal dan nilai.
- Mekanisme pilihan paket acuan ketika soal reguler berbeda antar peserta.
- Kebijakan resmi penanganan jawaban yang masih tersimpan lokal ketika batas waktu telah lewat.
- Prosedur persetujuan perubahan jadwal/soal yang sudah diterbitkan atau sudah dimulai.
- Aturan nomor meja dan cetak jika satu peserta mengikuti lebih dari satu tes dalam slot yang tidak bertabrakan.
- Batas waktu dan target performa terukur setelah simulasi awal.
- Cakupan dan jadwal backup, retensi data, serta metode HTTPS lokal.

---

*Dokumen ini adalah acuan produk yang berkembang bersama proyek; bukan klaim bahwa seluruh fitur sudah dibuat atau siap digunakan.*
