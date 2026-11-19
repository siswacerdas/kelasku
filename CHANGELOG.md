# Changelog Kelasku

Aturan: setiap fase penting atau perbaikan mencatat **Ditambah / Diubah / Diperbaiki** dan **Cek ulang**
(ID dari `docs/ANTI-REGRESI.md` yang harus diuji ulang setelah perubahan ini). Entri terbaru di atas.

## [0.5.0] – 2026-11-18 – Tujuan pembelajaran dengan telaah mutu
**Ide visual halaman**: TP tampil sebagai lembar kerja bergaris dengan rumusan kompetensi tersusun otomatis dari empat bagian, dan "telaah mutu" yang menemani seperti rekan sejawat (temuan dengan alasan), bukan daftar centang kaku.

**Ditambah**
- `/app/perencanaan/tujuan`: daftar TP (saring per kelas dan mata pelajaran) dan penyusun TP: kelas, mapel, elemen CP (boleh tanpa, untuk TP mandiri) beserta teks CP-nya, KKO, objek, konten, bukti (kalimat operasional tersusun otomatis), JP, tahapan proses (minimal 4), cara asesmen dan yang tidak dipakai, uji pemisahan empat pertanyaan.
- Telaah mutu otomatis (`features/tp/model.ts`, 13 uji): kolom wajib, objek KKO tinggi, KKO terhadap fase, JP, tahapan proses, asesmen generik, kesesuaian KKO dengan bentuk asesmen (Peta KKO), kriteria kualitatif tanpa indikator, uji pemisahan. Status **Siap** hanya terbuka bila tidak ada temuan "perlu diperbaiki"; saran tidak memblokir.
- Contoh terisi dari Buku Saku CP-ATP-TP Bagian V dijadikan **uji acuan**: harus selalu lolos tanpa temuan.

**Diubah**
- `firestore.rules`: koleksi `tp` ditambahkan. **Rules harus dipublikasikan ulang.**
- README: langkah `npm install` setiap kali `package.json` berubah ditegaskan.

**Diperbaiki / catatan**
- Galat build 0.3.0 pada komputer lokal ("Cannot find module 'exceljs' / 'vitest'") disebabkan dependensi baru belum terpasang setelah berkas ditimpa. Instalasi bersih diuji dan lolos (build, 34 uji). Kontrak DEV-1 ditambahkan agar tidak berulang.

**Cek ulang**: TP-1, TP-2, DEV-1, RULES-2, AUTH-2, LAYOUT-1 s.d. LAYOUT-5 pada `/app/perencanaan/tujuan` (terutama editor di 360 px dan 1920 px).

**Keputusan yang diambil**: TP boleh dibuat tanpa memilih elemen CP (jalur guru yang sudah punya TP). Keterkaitan ke CP hanya petunjuk, tidak memblokir. TP disimpan per kelas dan mapel (dipakai bersama oleh rombel paralel); profil kelas baru berpengaruh pada tahap tangga pertemuan.

## [0.4.0] – 2026-11-18 – Fondasi perencanaan: Bank CP, profil konteks, Pengaturan
**Ide visual halaman**: Bank CP menampilkan CP Fase A, B, C berdampingan dalam kolom (progresi terbaca sekilas), bukan kartu; profil konteks memperlihatkan dampak tiap jawaban di bawah pilihannya, bukan formulir pasif.

**Ditambah**
- `/app/perencanaan/cp` Bank CP: 16 mata pelajaran, 67 elemen (termasuk ISMUBA, sumber ditandai terpisah), cari lintas CP, filter fase, salin teks CP. Data statis dimuat dinamis (`src/data/cp.json`).
- Profil konteks dan Peta Keputusan (Buku Saku Scaffolding Bagian I.2 dan II): 2 variabel tingkat sekolah (di Pengaturan) dan 3 variabel tingkat kelas (di Kelas & siswa). "Tidak tahu" langsung memakai default konservatif dan ditandai asumsi.
- `/app/pengaturan`: data sekolah dan guru untuk kop dan blok pengesahan dokumen (dipakai saat ekspor RPM), profil sekolah, tampilan paket.
- `docs/PROTOKOL.md`: terjemahan Buku Saku (CP-ATP-TP, Scaffolding, RPM v3) ke aturan sistem, pembagian aturan kode vs AI, dan temuan ketidakkonsistenan pada dokumen sumber.
- Uji otomatis baru: integritas data CP dan Peta Keputusan (total 21 uji).

**Diubah**
- Menu Perencanaan memuat Bank CP. `tsconfig` mengaktifkan `resolveJsonModule`. Dokumen kelas boleh memuat `profile`; dokumen ruang kerja memuat `school`, `teacher`, `profile`.

**Cek ulang**: CP-1, PROFIL-1, PROFIL-2, SET-1, AUTH-2, RULES-1, LAYOUT-1 s.d. LAYOUT-5 pada `/app/perencanaan/cp`, `/app/pengaturan`, dan `/app/kelas`.

**Utang yang diketahui**: logo sekolah belum ada (diunggah saat ekspor dokumen dibangun); JP per mata pelajaran belum dikumpulkan (menunggu tahap TP/ATP); teks CP pada `cp.json` bersumber dari berkas guru dan belum diverifikasi ke dokumen resmi.

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
