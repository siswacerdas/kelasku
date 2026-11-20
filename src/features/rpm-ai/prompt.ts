import { alokasiMenit, TAHAP_INTI, type RpmFields } from "../rpm/model";
import type { Issue } from "../tp/model";
import type { GenInput } from "./types";

export const INSTRUKSI = `Anda membantu admin Kelasku menyusun Rencana Pembelajaran Mendalam (RPM) satu pertemuan untuk guru SD di Indonesia.
Tiga Buku Saku di bawah adalah SUMBER KEBENARAN tunggal: ikuti Buku Saku RPM v3 untuk struktur, pola, dan ceklis mutu; Buku Saku Scaffolding SD v2 untuk tangga, profil, dan Peta Keputusan; Buku Saku CP-ATP-TP untuk makna TP.
Aturan keras:
- Tulis dalam bahasa Indonesia yang jelas dan konkret, sesuai fase dan kelas. Tidak ada bagian A sampai D yang boleh dihilangkan.
- Setiap tabel kegiatan: satu baris satu tindakan; kolom waktu terisi dan bilangan bulat; JUMLAH WAKTU seluruh baris kelima tabel HARUS sama dengan alokasi waktu yang diberikan.
- Ritual pembuka (salam, doa) dan penutup (doa, salam) sebagai baris tersendiri; presensi, apersepsi, tujuan pembelajaran, rangkuman, dan tindak lanjut masing-masing baris tersendiri. Jangan memakai "Langkah N".
- Kolom catatan kosong kecuali baris benar-benar mencerminkan Berkesadaran, Bermakna, atau Menggembirakan; bila diisi, sebut prinsipnya dan alasan singkat.
- Adaptasi Cepat, Lambat, dan Pemalu wajib di tiap tahap inti. Delapan dimensi profil lulusan ditulis, 2 sampai 3 bertanda dominan.
- Elemen PAK dikosongkan kecuali ada kaitan alami; bila diisi, isi konsisten di A.3, B.2, catatan PAK, dan kolom PAK observasi.
- Patuhi Peta Keputusan profil yang diberikan (rangsangan bersama bila kesenjangan signifikan, tanpa media digital bila fasilitas terbatas, tangga tampil kelompok kecil bila siswa belum percaya diri, objek dalam kelas bila lahan minim).
- Jangan mengarang fakta tentang siswa atau sekolah di luar konteks yang diberikan; tulis asumsi yang wajar dan netral.
- Keluarkan hasil HANYA melalui alat (tool) yang diminta.`;

const ctx = (i: GenInput) => JSON.stringify({ meta: i.meta, alokasiMenit: alokasiMenit(i.meta), tp: i.tp, cp: i.cp, profil: i.profil, dasarPertemuan: i.dasar ?? null, arahanAdmin: i.arahan || null }, null, 1);

export const userAB = (i: GenInput) => `Susun bagian A (A.2, A.3) dan B (B.1 sampai B.7) RPM untuk pertemuan ke-${i.meta.pertemuanKe} dari ${i.meta.dariPertemuan}.
B.1 (cp) salin apa adanya dari konteks. TP harian harus spesifik untuk pertemuan ini (turunan dari dasar pertemuan bila ada) dan terpisah dari TP tahunan.
Konteks:
${ctx(i)}`;

export const userC = (i: GenInput, ab: unknown) => `Susun bagian C (lima tabel kegiatan, adaptasi tiga kategori pada tahap ${TAHAP_INTI.join(", ")}, dan catatan PAK) untuk RPM ini.
TOTAL WAKTU SEMUA BARIS = ${alokasiMenit(i.meta)} menit persis. Bagi kira-kira: pendahuluan 10 sampai 15 persen, memahami 25, mengaplikasi 30, merefleksi 15, penutup 8 sampai 10; periksa penjumlahan sebelum menjawab.
Bagian A dan B yang sudah disusun:
${JSON.stringify(ab, null, 1)}
Konteks:
${ctx(i)}`;

export const userD = (i: GenInput, ab: unknown) => `Susun bagian D (asesmen: diagnostik, formatif tiga tingkat, status sumatif, rubrik, ceklis observasi, KKTP) untuk RPM ini.
Pilih Rubrik Pengetahuan dan/atau Rubrik Kinerja sesuai jenis TP; bentuk asesmen harus sesuai KKO TP (hindari bentuk yang sering salah dipilih). Kolom PAK observasi true hanya bila Elemen PAK terisi.
Bagian A dan B yang sudah disusun:
${JSON.stringify(ab, null, 1)}
Konteks:
${ctx(i)}`;

export const userRepair = (i: GenInput, rpm: RpmFields, issues: Issue[]) => `RPM berikut belum lolos telaah mutu. Perbaiki HANYA hal yang disebut, dengan mengembalikan bagian yang berubah SECARA UTUH (a, b, c, dan/atau d); bagian yang tidak perlu diubah hilangkan.
Alokasi waktu: ${alokasiMenit(i.meta)} menit (jumlah semua baris harus sama).
Temuan:
${issues.map((x) => `- [${x.code}] ${x.message}`).join("\n")}
RPM saat ini:
${JSON.stringify({ a: rpm.a, b: rpm.b, c: rpm.c, d: rpm.d }, null, 1)}
Konteks:
${ctx(i)}`;
