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
- **LAYOUT-5** Semua kontrol bisa disentuh (tinggi minimal sekitar 44px) dan fokus keyboard terlihat.

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
- [ ] Entri `CHANGELOG.md` + baris "Cek ulang" ditulis

## Riwayat regresi
Format: tanggal – gejala – penyebab akar – perbaikan – kontrak yang ditambahkan.

_(belum ada)_
