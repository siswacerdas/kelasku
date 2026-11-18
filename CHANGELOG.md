# Changelog Kelasku

Aturan: setiap fase penting atau perbaikan mencatat **Ditambah / Diubah / Diperbaiki** dan **Cek ulang**
(ID dari `docs/ANTI-REGRESI.md` yang harus diuji ulang setelah perubahan ini). Entri terbaru di atas.

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
