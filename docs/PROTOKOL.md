# Protokol: dari Buku Saku ke sistem

Sumber: Buku Saku CP-ATP-TP v1.1, Buku Saku Scaffolding SD v2, Buku Saku RPM v3, analisis CP (Pancasila Fase A, Bahasa Indonesia Fase C).
Urutan kerja guru: Bank CP, bedah CP, TP, ATP, tangga pertemuan (scaffolding), RPM per pertemuan, ekspor dokumen resmi.

## Dua bahasa visual
- **Aplikasi**: "buku kerja guru" (lihat `DESAIN.md`).
- **Dokumen keluaran RPM**: format resmi-konservatif (Buku Saku RPM Bagian X): kop dengan logo dan garis tebal, judul kapital di tengah, tabel identitas 2 kolom, satu jenis font (Times New Roman 12pt atau Calibri 11pt), header tabel biru dongker `#1F3864` teks putih, tanpa warna cerah, blok pengesahan (kepala sekolah dan guru), nomor halaman. Data kop dan pengesahan berasal dari `/app/pengaturan`.

## Aturan yang dikode (deterministik, teruji)
| Sumber | Aturan |
|---|---|
| Scaffolding I.2, II | Profil konteks, default konservatif, pemetaan keputusan (sudah ada di 0.4.0) |
| Scaffolding VII, CP Buku Saku | Peta KKO ke bentuk asesmen, tiga level KKO |
| CP Buku Saku | TP wajib: tahapan proses minimal 4, KKO dengan objek, cara asesmen non-generik |
| RPM III, VIII | Struktur A-D lengkap; waktu terisi di tiap baris dan total sama dengan alokasi waktu; ritual pembuka dan penutup sebagai baris terpisah; 8 dimensi profil ditulis dengan 2-3 bertanda dominan; adaptasi Cepat/Lambat/Pemalu di tiap tahap inti; kriteria formatif tiga tingkat; status asesmen akhir (formatif-saja atau sumatif); rubrik minimal 4 level; ceklis observasi; tabel KKTP 4 kolom |

## Aturan yang memerlukan AI atau pertimbangan guru
Bedah CP, perumusan TP, pemilihan materi pintu masuk, uji granularitas baris kegiatan (satu baris satu tindakan), uji "guru pengganti bisa menjalankan", kreativitas dibanding dua pertemuan sebelumnya, kesesuaian bahasa dengan fase, kaitan alami dengan Pendidikan Antikorupsi (opsional, tidak dipaksakan).
Dua analisis CP dipakai sebagai **uji acuan** untuk keluaran AI: temuan kunci harus tetap muncul setelah prompt diubah.

## Temuan pada dokumen sumber (usulan perapian)
1. **Buku Saku RPM v3, Bagian VIII**: nomor ceklis tidak berurutan (6, 6b, 6d, 6e, 6f, 6c; tidak ada 6a) dan Bagian IX menyebut "13 poin" padahal tabel memuat 19 baris. Sistem membutuhkan daftar kanonik berkode (usul RPM-01 sampai RPM-19).
2. **Buku Saku RPM v3, Bagian X.3, butir terakhir**: masih menyebut "langkah bernomor (Bagian C) berupa teks terstruktur (bukan tabel)", bertentangan dengan Bagian C yang mewajibkan tabel No/Waktu/Kegiatan/Catatan. Tampaknya sisa v2.
3. **Sumber CP**: berkas `CP.html` menandai mapel ISMUBA bersumber Kurikulum ISMUBA Muhammadiyah 2024, berbeda dari Kurikulum Merdeka 2025. Sistem menyimpan sumber per mapel.
