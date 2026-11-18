# Changelog Kelasku

Aturan: setiap fase penting atau perbaikan mencatat **Ditambah / Diubah / Diperbaiki** dan **Cek ulang**
(ID dari `docs/ANTI-REGRESI.md` yang harus diuji ulang setelah perubahan ini). Entri terbaru di atas.

## [0.3.0] – 2026-11-18 – Kelas & siswa
**Ide visual halaman**: daftar absen bergaris seperti buku induk (baris bernomor, bukan kartu); kelas sebagai tab di HP dan daftar tegak di PC lebar; panel tambah siswa menetap di kanan pada layar ≥1536px.

**Ditambah**
- Halaman `/app/kelas`: tambah/ubah/hapus kelas (fase otomatis dari tingkat) dan siswa (ketik, ubah, hapus).
- Impor siswa: tempel dari Excel/CSV/daftar nama, atau berkas `.xlsx`/`.csv`, dengan pratinjau sebelum disimpan (baris bermasalah dilewati, bukan menggagalkan semua).
- Template Excel dibuat aplikasi (`Unduh template`); judul kolom dikenali fleksibel sehingga template boleh disesuaikan.
- Uji otomatis (`npm test`, vitest) untuk pembaca impor dan template; dijalankan juga di workflow deploy sebelum build.

**Diubah**
- Data siswa: `nama` (wajib), `nis`, `nisn`, `jenis kelamin` (L/P), semuanya opsional kecuali nama. Tidak ada data pribadi lain.
- `exceljs` ditambahkan (dimuat dinamis, tidak membebani halaman lain).

**Cek ulang**: KELAS-1, KELAS-2, DATA-2, AUTH-2, RULES-2 (koleksi `classes`/`students` sudah ada di rules sejak 0.2.0), LAYOUT-1 s.d. LAYOUT-5 pada `/app/kelas`.

## [0.2.0] – 2026-11-18 – Kerangka aplikasi responsif
**Ditambah**
- `AppShell`: sidebar di PC, bar atas + menu bawah di HP; isi halaman mengisi sisa lebar layar.
- Peta rute `/app/*` (Beranda, Kelas, Perencanaan, Asesmen, Nilai, Dokumen, Pengaturan) dengan halaman sementara.
- `PageHeader` seragam, motif `garis-buku`, skala font root untuk layar ≥1920px dan ≥2560px.
- Dokumen panduan: `docs/ANTI-REGRESI.md`, `docs/DESAIN.md`, `docs/STRUKTUR.md`.

**Diubah**
- `/` dan rute tak dikenal kini mengarah ke `/app`. Dasbor dirancang ulang (dua kolom di layar lebar).
- `firestore.rules`: koleksi `students`, `subjects`, `objectives` ditambahkan. **Rules harus dipublikasikan ulang.**

**Cek ulang**: AUTH-1, AUTH-2, RULES-2, LAYOUT-1 s.d. LAYOUT-5.

**Utang yang diketahui**: `LoginPage` belum diaudit di layar ≥1920px dan belum memakai skala baru secara penuh.

## [0.1.0] – 2026-11-18 – Kerangka awal
**Ditambah**: Vite + React + TypeScript + Tailwind; login Google; pembuatan profil, ruang kerja, dan keanggotaan owner saat login pertama;
`firestore.rules` dan `storage.rules` berbasis keanggotaan ruang kerja; `.htaccess`, workflow deploy (belum dipakai).

**Cek ulang**: AUTH-1, AUTH-2, RULES-1.
