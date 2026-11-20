# Antiregresi Kelasku

Tujuan: hal yang sudah benar tidak rusak lagi saat menambah fitur. Dibaca sebelum dan sesudah setiap perubahan.

## Cara memakai
1. Sebelum mengubah: baca "Kontrak" di bawah yang tersentuh perubahan itu.
2. Sesudah mengubah: uji kontrak tersebut, lalu tulis entri di `CHANGELOG.md` dengan baris **Cek ulang**.
3. Jika ada regresi: perbaiki, lalu catat di "Riwayat regresi" (penyebab akar + kontrak baru bila perlu).

## Kontrak (tidak boleh rusak)

### Autentikasi dan data
- **AUTH-1** Login Google pertama kali membuat `users/{uid}`, `workspaces/{uid}`, dan `workspaces/{uid}/members/{uid}` (role `owner`). Jika gagal, pesan error tampil di dalam aplikasi, tidak diam.
- **AUTH-2** Semua rute `/app/*` butuh login; yang belum login diarahkan ke `/login`; yang sudah login tidak melihat `/login`.
- **AUTH-3** Saat tayang: domain produksi terdaftar di Firebase → Authentication → Authorized domains.
- **RULES-1** Klien tidak bisa mengubah `plan` atau `ownerId` ruang kerja; data hanya terbaca oleh anggota ruang kerja itu.
- **RULES-2** Setiap koleksi baru di bawah `workspaces/{ws}` **wajib** ditambahkan ke daftar di `firestore.rules`, lalu rules dipublikasikan ulang. Lupa langkah ini membuat penyimpanan ditolak.
- **DATA-1** Mengganti nama field atau bentuk data yang sudah dipakai butuh catatan migrasi di changelog.

### Tata letak (berlaku untuk SETIAP halaman baru, lihat checklist)
- **LAYOUT-1** Tidak ada gulir horizontal pada lebar 360px.
- **LAYOUT-2** Isi tidak tertutup menu bawah di HP (ruang bawah cukup, termasuk area aman iPhone).
- **LAYOUT-3** Pada 1920px dan 2560px isi mengisi area kerja: tidak ada ruang kosong lebar di kiri-kanan, dan ukuran teks/kontrol tidak terlihat kecil.
- **LAYOUT-4** Paragraf tidak melebihi sekitar 65–75 karakter per baris; lebar tambahan dipakai untuk kolom lain, bukan memanjangkan teks.
- **LAYOUT-6** Pola tiga zona untuk halaman padat (papan + rel samping) memakai `min-[110rem]` (1760 px), bukan `2xl`, agar kolom tidak menyempit di 1536 px.
- **LAYOUT-5** Semua kontrol bisa disentuh (tinggi minimal sekitar 44px) dan fokus keyboard terlihat.

### Kelas dan siswa
- **KELAS-1** Template yang diunduh aplikasi harus terbaca kembali oleh pembaca impor (diuji otomatis). Mengubah judul kolom template atau daftar `ALIASES` di `importParser.ts` wajib disertai pembaruan uji dan `npm test` hijau.
- **KELAS-2** Impor tidak pernah menyimpan baris bermasalah diam-diam: baris dengan galat (nama kosong, NIS ganda, NIS sudah ada) dilewati dan ditampilkan di pratinjau; penyimpanan hanya setelah guru menekan konfirmasi.
- **DATA-2** Menghapus kelas kini menghapus siswanya. Saat `plans`, `assessments`, atau `scores` mulai merujuk kelas/siswa, `deleteClass` dan `deleteStudent` WAJIB diubah untuk memeriksa keterkaitan dulu (jangan sampai nilai yatim).
- **DATA-3** Data siswa dibatasi pada nama, NIS, NISN, jenis kelamin. Menambah kolom pribadi baru butuh alasan tertulis di changelog.

### Perencanaan
- **CP-1** `src/data/cp.json` adalah data acuan: 16 mapel, 67 elemen, tiap elemen berteks untuk setiap fase mapelnya, sumber KM 2025 dan ISMUBA 2024 tidak tercampur. Mengubahnya wajib disertai sumber di changelog dan `npm test` hijau.
- **PROFIL-1** Peta Keputusan (`profile.ts`) harus identik dengan Buku Saku Scaffolding Bagian II. Default "Tidak tahu": lokasi A, digital B, kemampuan B, kesenjangan A, percayaDiri B. Mengubahnya butuh alasan di changelog dan uji yang diperbarui.
- **PROFIL-2** Setiap keputusan yang ditampilkan atau dipakai harus menyebut asalnya: jawaban guru atau asumsi default.
- **TP-1** Contoh terisi di Buku Saku CP-ATP-TP Bagian V (uji `baik()` di `tp/model.test.ts`) harus selalu lolos telaah tanpa error dan saran. Mengubah aturan telaah wajib menjaga uji ini hijau, atau menjelaskan di changelog mengapa buku saku yang berubah.
- **TP-2** Status "Siap" tidak boleh dapat dipilih selama ada temuan tingkat error. Aturan baru ditulis sebagai kode TP-nn, lengkap dengan uji, dan sumbernya (bagian buku saku) dicatat di komentar.
- **ATP-1** Urutan dan kode TP (`5.1`, `5.2`, ...) harus stabil: TP yang belum diurutkan ditaruh paling akhir, urutan seri selalu menghasilkan hasil yang sama (uji `sortTps`, `labelMap`).
- **ATP-2** Relasi prasyarat tidak boleh meloloskan urutan terbalik, prasyarat diri sendiri, atau lingkaran. Aturan telaah alur baru ditulis sebagai kode ATP-nn, lengkap dengan uji dan rujukan Bagian buku saku.
- **DATA-1 (tambahan)** Penyusun TP hanya menulis bidang TP lewat `toStoredFields`; bidang `atp`, `id`, dan `status` tidak boleh ikut tertulis dari salinan lama. Menambah bidang TP baru berarti menambahkannya ke `toStoredFields` dan ke uji.
- **SC-1** Contoh tangga lengkap (`lengkap()` di `scaffold/model.test.ts`) harus selalu lolos telaah tanpa error dan saran. Aturan baru wajib menjaga uji ini hijau.
- **SC-2** Aturan telaah yang bersumber dari Peta Keputusan (SC-08, SC-17, SC-18, SC-22, SC-23) membaca jawaban dari `profile.ts` (satu-satunya sumber, PROFIL-1). Dilarang menduplikasi aturan pemetaan di tempat lain. Satu dokumen tangga per pasangan TP dan rombel (id `tpId_classId`); jangan mengubah pola id tanpa migrasi (DATA-1).
- **RPM-1** Contoh "Norma dan Aturan" dari Buku Saku RPM v3 (`lengkap()` di `rpm/model.test.ts`) harus selalu lolos ceklis tanpa error dan saran. Aturan baru wajib menjaga uji ini hijau.
- **RPM-2** Kode ceklis RPM-01..RPM-19 adalah penomoran kanonik; menambah atau mengubah butir berarti memperbarui `CEKLIS`, uji, dan `docs/PROTOKOL.md`. Butir audit mandiri tidak boleh dihitung "lolos" sebelum dicentang guru.
- **RPM-3** Template Excel yang diunduh harus terbaca kembali dan isian tunggal dikenali dari kode (uji round-trip, termasuk lewat berkas Excel sungguhan). Mengubah `SCALARS` di `fields.ts` otomatis mengubah editor dan template; uji `template.test.ts` harus tetap hijau.
- **ROLE-1** Peran admin HANYA dari custom claim yang dipasang lewat Admin SDK, dibaca klien hanya untuk menampilkan menu; penegakan selalu di `firestore.rules` (`isAdmin()`). Dilarang menyimpan peran di dokumen yang dapat ditulis klien. Kueri pustaka untuk guru wajib memuat `where("status","==","terbit")`.
- **SET-1** Menyimpan pengaturan tidak boleh mengubah `plan` atau `ownerId` (dijaga rules; uji manual setelah mengubah `firestore.rules`).

### Pengembangan lokal
- **DEV-1** Setelah menimpa berkas dari paket pembaruan, jika `package.json` ikut berubah (lihat changelog), jalankan `npm install` SEBELUM `npm run build` atau `npm run dev`. Lalu commit `package-lock.json` yang diperbarui; tanpa itu `npm ci` di workflow GitHub gagal.
- **DEV-3** `scripts/cek-deps.mjs` (dijalankan oleh `predev`, `prebuild`, `pretest`) tidak boleh dilepas dari skrip npm. Bila muncul pesannya, ikuti petunjuknya sebelum mencari penyebab lain.
- **DEV-2** Sebelum push: `npm test` dan `npm run build` keduanya lolos.

### Penayangan
- **DEPLOY-1** `public/.htaccess` ikut terbawa ke `dist/`; refresh di rute dalam (mis. `/app/kelas`) tidak menghasilkan 404.
- **DEPLOY-2** Semua `VITE_FIREBASE_*` terisi di GitHub Secrets; `package-lock.json` ter-commit.

## Checklist halaman baru (salin ke catatan perubahan)
Uji lebar: **360, 390, 768, 1366, 1920, 2560 px** (DevTools → ikon perangkat → Responsive → isi lebar manual).
- [ ] 360 / 390: tidak ada gulir horizontal; tombol utama terjangkau jempol; menu bawah tidak menutupi isi
- [ ] 768: tidak terlihat seperti HP yang dilebarkan, tidak seperti PC yang dipaksa sempit
- [ ] 1366: tidak ada elemen terpotong
- [ ] 1920 / 2560: isi mengisi area kerja, tidak ada lautan kosong di kiri-kanan
- [ ] Memakai `PageHeader` dan pola kolom dari `docs/DESAIN.md`
- [ ] Keadaan kosong, memuat, dan error sudah dirancang (bukan hanya keadaan terisi)
- [ ] Koleksi data baru sudah ada di `firestore.rules` (RULES-2)
- [ ] `npm install` dijalankan bila `package.json` berubah (DEV-1); `npm test` hijau dan `npm run build` lolos
- [ ] Entri `CHANGELOG.md` + baris "Cek ulang" ditulis

## Riwayat regresi
Format: tanggal – gejala – penyebab akar – perbaikan – kontrak yang ditambahkan.

_(belum ada)_
