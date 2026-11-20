# Changelog Kelasku

Aturan: setiap fase penting atau perbaikan mencatat **Ditambah / Diubah / Diperbaiki** dan **Cek ulang**
(ID dari `docs/ANTI-REGRESI.md` yang harus diuji ulang setelah perubahan ini). Entri terbaru di atas.

## [0.8.0] – 2026-11-19 – RPM per pertemuan, template Excel, pustaka, dan peran admin
**Ide visual halaman**: dokumen kerja panjang A sampai D dengan ceklis mutu 19 butir yang menetap di rel kanan (mulai 1760 px) dan berubah dari "Perlu" menjadi "Lolos" saat guru menulis; tabel kegiatan memperlihatkan subtotal waktu per tahap dan total terhadap alokasi.

**Keputusan arah (pemilik produk)**: AI hanya untuk admin. Guru memakai RPM dari pustaka, mengetik sendiri, atau mengunggah template Excel. Karena itu 0.8.0 membangun semua fondasi yang dibutuhkan AI admin (skema, validator, pustaka, peran), dan fungsi AI-nya sendiri dijadwalkan di 0.9.0.

**Ditambah**
- `/app/perencanaan/rpm` (menu **RPM**; rute lama `rencana` dialihkan): tab **RPM saya** dan **Pustaka**.
- Editor RPM manual untuk seluruh struktur Buku Saku RPM v3 (A. Identifikasi, B. Desain, C. Pengalaman belajar dengan lima tabel No/Waktu/Kegiatan/Catatan dan adaptasi Cepat/Lambat/Pemalu, D. Asesmen termasuk rubrik, ceklis observasi, KKTP), dapat dimulai dari TP (mengisi tautan, mapel, kelas, TP tahunan, CP, instrumen).
- **Ceklis mutu 19 butir** (`features/rpm/model.ts`, 24 uji): penomoran kanonik RPM-01..RPM-19 atas baris ceklis Bagian VIII. Butir otomatis: struktur lengkap, TP/indikator, 8 dimensi, adaptasi, "Langkah N", waktu (setiap baris dan total sama dengan alokasi), granularitas (heuristik), ritual pembuka/penutup, catatan, formatif tiga tingkat, status sumatif, rubrik, observasi, KKTP, konsistensi PAK, data kop. Butir yang tidak dapat diperiksa mesin (kreativitas, kesesuaian fase, guru pengganti, inklusif) menjadi **audit mandiri** berupa centang.
- **Template Excel** (unduh dan unggah): tujuh lembar (Isi, Dimensi, Kegiatan, Adaptasi, Rubrik, Observasi, KKTP) plus Petunjuk. Isian tunggal dikenali dari KODE, jadi label boleh disesuaikan. Hasil unggah dibuka di editor dengan catatan hal yang tidak dikenali; tidak langsung tersimpan.
- **Pustaka RPM** (`rpmLibrary`): guru melihat yang terbit dan menekan Gunakan (disalin ke RPM saya sebagai draf, audit mandiri direset); admin membuat, mengubah, menerbitkan, menarik, dan menghapus.
- **Peran admin** lewat custom claim (`admin: true`), dibaca di `AuthContext` (`isAdmin`) dan ditegakkan di `firestore.rules`. Skrip `scripts/set-admin.mjs` memasang peran (dijalankan sekali oleh pemilik proyek).
- **Pengaman dependensi** `scripts/cek-deps.mjs`, dijalankan otomatis sebelum `dev`, `build`, dan `test`: memeriksa setiap paket yang diimpor kode ada di `package.json` dan terpasang di `node_modules`, lalu memberi pesan jelas. Dibuat karena galat "Failed to resolve import exceljs" terjadi dua kali di komputer lokal.

**Diubah**
- `firestore.rules`: koleksi `rpm` (per ruang kerja) dan `rpmLibrary` (global; baca = terbit atau admin, tulis = admin).
- Bidang isian tunggal RPM didefinisikan sekali (`fields.ts`) dan dipakai editor sekaligus template Excel.

**Cek ulang**: RPM-1, RPM-2, RPM-3, ROLE-1, DEV-1, RULES-2, AUTH-2, LAYOUT-1 s.d. LAYOUT-6 pada `/app/perencanaan/rpm` (editor di 360 px, 1280 px, 1920 px; kedua tab).

**Utang yang diketahui**: ekspor dokumen resmi Word/PDF (Bagian X: kop, tabel identitas, blok pengesahan) dijadwalkan setelah AI; "Modul ajar" masih halaman sementara (belum diputuskan apakah terpisah dari RPM); skrip `set-admin.mjs` dan aturan `rpmLibrary` belum teruji terhadap Firebase sungguhan (tidak dapat dijalankan di lingkungan pengembangan ini); uji granularitas bersifat heuristik.

## [0.7.0] – 2026-11-18 – Tangga pertemuan (scaffolding) per TP per rombel
**Ide visual halaman**: lembar kerja panjang yang mengikuti Blok 0-3 buku saku, dengan "peta keputusan kelas" dan telaah mutu menetap di rel kanan (mulai 1760 px) sehingga guru melihat langsung bagaimana profil kelasnya memengaruhi tangga yang ia susun.

**Ditambah**
- `/app/perencanaan/tangga` (menu **Tangga pertemuan**): pilih rombel, lihat TP kelas itu (hanya TP berstatus siap yang bisa dimulai), lalu susun tangga. Satu dokumen per pasangan TP dan rombel (`scaffolds/{tpId}_{classId}`), sehingga 5A dan 5B bisa berbeda.
- Editor mengikuti Buku Saku Scaffolding Bagian IX: analisis TP (arti KKO, bukti, yang bukan termasuk, prasyarat, materi terpilih dan alasan, konten WAJIB/PILIHAN), diagnostik awal, minimal dua alternatif (bertahap tunggal, kontras berpasangan, lainnya) beserta rasional "cocok jika ...", tangga berbobot (wajib, ideal, pengayaan) lengkap dengan panduan langkah pertama, uji validitas tiga pertanyaan, pertemuan inti, bentuk rangsangan, objek pengamatan, JP per pertemuan.
- Telaah mutu (`features/scaffold/model.ts`, 18 uji) dengan kode SC-00 s.d. SC-23: kolom wajib, minimal 2 alternatif, Peta Keputusan profil (kelas heterogen perlu alternatif bertahap tunggal; kesenjangan signifikan melarang rangsangan pribadi; sekolah minim lahan melarang objek luar kelas; fasilitas digital terbatas menolak media digital; siswa kurang percaya diri butuh tangga kelompok kecil), bantuan yang harus menyusut (1H), kriteria kualitatif (1F), kecukupan JP, kesesuaian bentuk asesmen dengan KKO, dan deteksi profil yang berubah sejak tangga disusun.
- Kerangka awal otomatis: dua alternatif dan pertemuan inti terisi dari TP.

**Diubah**
- `firestore.rules`: koleksi `scaffolds` ditambahkan. **Rules harus dipublikasikan ulang.**

**Cek ulang**: SC-1, SC-2, PROFIL-1, PROFIL-2, DATA-1, RULES-2, LAYOUT-1 s.d. LAYOUT-6 pada `/app/perencanaan/tangga` (terutama editor di 360 px, 1280 px, dan 1920 px).

**Utang yang diketahui**: profil spesifik-TP "akses lahan/kebun" (Bagian I.3) belum ditanyakan; sementara dicakup oleh isian "Objek pengamatan". Panduan refleksi pasca-pembelajaran (Bagian X) belum ada. Uji 1I (siklus lintas fase) dan 1J (tumpang tindih mapel) belum dikode karena butuh pertimbangan guru atau AI.

**Keputusan yang diambil**: pelanggaran Peta Keputusan yang bersifat larangan keras di buku saku (rangsangan pribadi saat kesenjangan signifikan) berstatus error; yang bersifat anjuran (media digital, objek luar kelas) berstatus saran, karena guru bisa saja lebih tahu kondisi kelasnya, dan koreksi yang benar adalah memperbarui jawaban profil.

## [0.6.0] – 2026-11-18 – Alur tujuan pembelajaran (ATP)
**Ide visual halaman**: papan dua kolom per kelas dalam satu fase (fondasi proses di kelas awal, penguatan di kelas akhir), TP berkode 5.1, 5.2 agar relasi prasyarat terbaca seperti nomor pasal; telaah alur dan rekap JP duduk di rel kanan pada layar sangat lebar.

**Ditambah**
- `/app/perencanaan/alur`: pilih mata pelajaran dan fase; atur urutan (naik/turun), pindah TP antar kelas dalam fase, tulis alasan penempatan, tandai prasyarat, dan tandai TP yang perlu diulang atau diperdalam lintas kelas beserta catatannya.
- Telaah alur (`features/atp/model.ts`, 11 uji): alasan penempatan, semua TP menumpuk di satu kelas, prasyarat yang urutannya lebih akhir (error), prasyarat diri sendiri dan lingkaran prasyarat (error), prasyarat yang sudah dihapus, pendalaman tanpa catatan, elemen CP yang belum punya TP, jumlah TP draf.
- Rekap JP per elemen dan per kelas (Buku Saku Bagian VIII), termasuk baris TP mandiri.

**Diubah**
- Data ATP disimpan di dalam dokumen TP (`atp`: urutan, alasan, prasyarat, kontinuitas, catatan), bukan koleksi terpisah; **tidak ada perubahan rules**.
- Penyimpanan TP kini hanya menulis bidang TP (`toStoredFields`), sehingga mengubah TP tidak menimpa data ATP dengan salinan lama (DATA-1; diuji).

**Cek ulang**: ATP-1, ATP-2, DATA-1, TP-1, TP-2, LAYOUT-1 s.d. LAYOUT-5 pada `/app/perencanaan/alur` (papan dua kolom di 1280 px; rel kanan di 1760 px ke atas).

**Keputusan yang diambil**: satu alur bersama per fase (kedua kelas dalam satu papan), mengikuti Bagian VII yang menekankan pembagian antar kelas dalam satu fase. Kelas awal dan akhir ditentukan oleh `grade` pada TP, jadi memindahkan TP antar kelas juga mengubah kelas TP itu.

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
