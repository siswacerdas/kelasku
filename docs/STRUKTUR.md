# Struktur Kelasku (target awal: guru SD)

## Rute
```
/                      → diarahkan ke /app (landing publik menyusul)
/login
/app                   Beranda
/app/kelas             Kelas & siswa
/app/perencanaan/tujuan | rencana | modul
/app/asesmen
/app/nilai
/app/dokumen
/app/pengaturan
(kelak) /siswa/...     portal siswa untuk LMS
```

## Model data (Firestore)
Semua di bawah `workspaces/{ws}`; `ws` = uid guru untuk ruang kerja pribadi.
```
workspaces/{ws}            name, ownerId, plan, school{nama, alamat, kepalaSekolah}, activeYear{label, semester}
  members/{uid}            role: owner | teacher | student
  classes/{id}             name ("5A"), grade (5), fase ("C"), yearLabel
  students/{id}            classId, name, nis, nisn, gender (L/P)  ← data minimal; data anak dijaga ketat (DATA-3)
  subjects/{id}            name                          ← guru kelas SD: banyak mapel per kelas
  objectives/{id}          subjectId, grade, semester, text (tujuan pembelajaran)
  plans/{id}               classId, subjectId, objectiveIds[], isi rencana, status: draft | final
  modules/{id}             planId, isi modul
  assessments/{id}         moduleId, objectiveIds[], jenis, butir
  scores/{id}              assessmentId, studentId, objectiveId, nilai
```
Prinsip: dokumen menyimpan **ID rujukan** ke induknya, bukan salinan teks.
Setiap koleksi baru wajib masuk `firestore.rules` (RULES-2).

## Kekhasan guru SD
- Satu guru kelas mengajar banyak mata pelajaran pada satu rombel; mata pelajaran dipilih di dalam kelas, bukan sebaliknya.
- Fase dan kelas menentukan daftar tujuan pembelajaran yang ditawarkan.
- Data siswa adalah data anak: simpan seperlunya (nama, NIS), jangan menambah kolom pribadi tanpa alasan kuat.

## Jalur ke LMS
Kelas dan siswa yang sama dipakai LMS: siswa punya akun yang ditautkan ke `students/{id}`; modul "diterbitkan" ke kelas;
asesmen dikerjakan siswa dan hasilnya langsung masuk `scores`.

## Revisi 0.4.0: model perencanaan (setelah mempelajari Buku Saku)
Model awal (`objectives` berisi teks) terlalu sederhana. Arah berikutnya, dibangun bertahap dan tiap koleksi baru wajib masuk `firestore.rules` (RULES-2):
```
src/data/cp.json              Bank CP (statis, bukan Firestore)
workspaces/{ws}               + school{...}, teacher{...}, profile{lokasi, digital}     [sudah ada, 0.4.0]
classes/{id}                  + profile{kemampuan, kesenjangan, percayaDiri}            [sudah ada, 0.4.0]
cpAnalyses/{id}               bedah CP per elemen: temuan, risiko template, usulan pemisahan
tp/{id}                       kompetensi operasional (KKO, objek, konten), JP, tahapan proses (>=4),
                              cara asesmen + yang dihindari, rujukan elemen CP, kelas, status
atp/{id}                      urutan TP per kelas + relasi (prasyarat, pengulangan lintas kelas)
scaffolds/{id}                tangga pertemuan per TP, minimal 2 alternatif, berbasis profil
rpm/{id}                      satu RPM per pertemuan: A-D terstruktur (bukan teks bebas) agar dapat divalidasi
```
Prinsip: RPM disimpan sebagai data terstruktur (baris kegiatan dengan waktu, tabel adaptasi, kriteria tiga tingkat, rubrik), sehingga ceklis mutu dapat dijalankan otomatis dan dokumen resmi (Word) dibuat dari data, bukan sebaliknya.

## Revisi 0.6.0: ATP
ATP tidak dibuat sebagai koleksi terpisah. Datanya melekat pada dokumen TP agar relasi (prasyarat, urutan) tidak bisa yatim dari TP-nya:
```
tp/{id}.atp = { urutan, alasan, prasyarat[tp id], kontinuitas: tuntas | diperdalam, catatan }
```
Alur satu fase = semua TP dengan `mapelId` yang sama dan `grade` dalam fase itu. Koleksi `atp/{id}` pada rencana 0.4.0 tidak dipakai.

## Revisi 0.7.0: tangga pertemuan
```
scaffolds/{tpId}_{classId}   analisis{kkoMakna, buktiTercapai, bukanTermasuk, prasyarat, materiTerpilih, alasanMateri, konten[]},
                             diagnostik{tugas, caraMembaca, keputusanAwal},
                             alternatif[{nama, jenis, rasional, uji{sederhana,fondasi,cukup}, tangga[{kompetensi, materi, mengapa,
                               tandaBerhasil, bobot, bantuan, skala, media, persiapanGuru, kalimatPembuka, diamati, jikaBelum}]}],
                             inti{kompetensi, materiPuncak, bentukAsesmen, instrumen}, rangsangan, objekPengamatan,
                             jpPerPertemuan, profilHash, status
```
`profilHash` menyimpan ringkasan jawaban profil saat tangga terakhir disimpan; bila profil berubah, telaah memberi peringatan SC-07. Koleksi `rpm` (berikutnya) akan merujuk satu tangga (`scaffoldId`) dan satu pertemuan di dalamnya.

## Revisi 0.8.0: RPM, pustaka, admin
```
workspaces/{ws}/rpm/{id}     RpmFields + status (draf|siap) + sumber{libraryId}?   (milik guru)
rpmLibrary/{id}              RpmFields + status (draf|terbit) + judul + updatedBy   (global; admin menulis, guru membaca yang terbit)
RpmFields                    identitas, a{peserta didik, materi}, b{CP, TP tahunan/harian, indikator, 8 dimensi, praktik, kemitraan, lingkungan},
                             c{5 tabel kegiatan (waktu, kegiatan, catatan), adaptasi 3 kategori x 3 tahap inti, catatan PAK},
                             d{diagnostik, formatif 3 tingkat, sumatif, rubrik pengetahuan/kinerja, observasi, KKTP}, konfirmasi (audit mandiri)
```
Peran: custom claim `admin: true` pada token Auth (bukan dokumen Firestore). AI (0.9.0) berjalan di Cloud Functions, hanya dapat dipanggil admin, menulis ke `rpmLibrary` berstatus draf, dan keluarannya wajib lolos `lintRpm` sebelum bisa diterbitkan.

## Revisi 0.9.0: AI
```
functions/                   Cloud Function generateRpm (Node 22), dibundel esbuild dari ../src (rpm, rpm-ai, tp, profil)
functions/prompts/           tiga Buku Saku sebagai instruksi sistem berversi
rpmLibrary/{id}.ai           { model, promptVersion, repaired, adjustedTime, remaining[kode temuan], usage } + createdBy
aiUsage/{uid}_{yyyy-mm-dd}   { count } kuota harian; hanya ditulis fungsi (Admin SDK), tertutup bagi klien oleh rules
```
Alur: klien admin -> `generateRpm` (cek claim, validasi, kuota) -> A+B -> C dan D paralel -> rakit -> `lintRpm` -> satu perbaikan -> simpan draf pustaka -> admin meninjau dan menerbitkan.
