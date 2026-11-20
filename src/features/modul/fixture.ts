/**
 * Modul acuan lengkap (Fase C, 4 subunit) untuk uji ceklis dan, kelak, uji pembuat modul AI.
 * CATATAN: Buku Saku Modul v5 tidak memuat contoh modul utuh; modul ini disusun dari kriteria ceklis Bagian L
 * dan SEMENTARA menjadi acuan. Ganti dengan modul contoh milik pemilik produk bila tersedia.
 */
import { emptyModul, emptySubunit, type ModulFields, type Soal, type Subunit } from "./model";

const so = (jenis: Soal["jenis"], teks: string, kunci = "jawaban: ...", opsi = ""): Soal => ({ jenis, teks, opsi, kunci });
const P = (...s: string[]) => s.join(" ");
const bacaan = (a: string, b: string) => [
  P(`Di ${a}, kita sering menemukan hal yang berkaitan dengan aturan.`, "Aturan dibuat supaya semua orang merasa aman dan adil.", "Setiap orang punya tugas yang perlu dijalankan dengan baik.", "Kalau satu orang lupa, teman yang lain bisa ikut kesulitan."),
  P(`Sekarang perhatikan ${b} dengan teliti.`, "Coba ingat kejadian yang pernah kamu alami sendiri.", "Dari kejadian itu, kita bisa belajar apa akibat dan alasannya.", "Dengan begitu kita mengerti mengapa aturan itu penting."),
];

function sub(over: Partial<Subunit>, n: number): Subunit {
  const base = emptySubunit();
  return {
    ...base,
    judul: `Subunit ${n}: Belajar tentang aturan bagian ${n}`,
    orientasi: "Di bagian ini kamu akan belajar tentang aturan di sekitarmu. Ini bermanfaat agar kamu dapat bersikap adil dan bertanggung jawab.",
    jembatan: n > 1 ? `Kamu sudah belajar bagian ${n - 1}. Sekarang kita lanjutkan ke bagian berikutnya.` : "",
    pemantik: ["Pernahkah kamu melihat teman antre dengan tertib? Apa yang kamu rasakan?", "Menurutmu, mengapa ada aturan di sekolah?"],
    bacaan: bacaan("sekolah", "contoh berikut"),
    aktivitas: { jenis: "mengamati", judul: "Yuk, Mengamati", tujuan: "Kamu akan melatih ketelitian dengan mengamati.", langkah: ["Amati situasi di sekitarmu.", "Catat tiga hal yang kamu lihat."], tugas: "Tulis hasil pengamatanmu di tabel.", interaktif: false, padananCetak: "" },
    formatif: [so("isian", "Sebutkan satu aturan di kelasmu."), so("uraian", "Jelaskan mengapa aturan itu dibuat."), so("penerapan", "Jika temanmu menyerobot antrean, apa yang akan kamu lakukan? Mengapa?")],
    refleksi: ["Apa yang kamu pelajari hari ini?", "Apa yang masih membingungkan bagimu?"],
    tugasRumah: n === 1 ? "" : "Tanyakan satu aturan di rumahmu kepada orang tuamu, lalu catat.",
    nilaiIslami: ["Bismillah sebelum belajar"], pakWujud: "",
    ...over,
  };
}

export function lengkapModul(): ModulFields {
  const m = emptyModul();
  Object.assign(m, { mapelId: "ppkn", grade: 5, semester: 1, judul: "Aturan dan Kita", format: "cetak", jumlahTangga: 4 });
  m.dimensiFokus = [{ nama: "Penalaran Kritis", wujud: "Soal analisis kasus: mengapa dan bagaimana jika" }, { nama: "Kolaborasi", wujud: "Diskusi kelompok berperan pada subunit 2" }];
  m.pengantar = {
    salam: "Assalamu'alaikum, Sahabat Belajar! Selamat datang.", tentang: "Unit ini membahas aturan di sekitar kita dan alasan di baliknya.",
    mengapa: "Mengerti aturan membuat kita lebih adil dan bertanggung jawab.", caraPakai: "Baca bagian demi bagian, jawab pertanyaan, dan kerjakan aktivitasnya.",
    tujuan: "Kamu akan dapat menjelaskan mengapa aturan penting bagi kehidupan bersama.", produk: "Di akhir unit ini, kamu akan membuat T-Chart Aturan dan Alasannya sendiri.",
  };
  m.asesmenAwal = {
    soal: [so("pg", "Aturan dibuat untuk ...", "b", "a. menyulitkan\nb. membuat semua aman\nc. tidak ada gunanya"), so("bs", "Aturan hanya berlaku di sekolah. Benar atau salah? Beri alasan.", "salah"), so("isian", "Sebutkan satu contoh aturan di rumah.", "bebas"), so("cocok", "Cocokkan aturan dengan tempatnya.", "1-b, 2-a")],
    motivasi: "Jawaban kamu tadi tidak dinilai, hanya untuk membantu kita belajar bersama!",
  };
  const b1 = sub({ bacaan: [bacaan("sekolah", "x")[0], bacaan("sekolah", "x")[1]].slice(0, 2).map((p) => p.split(". ").slice(0, 4).join(". ")) }, 1);
  const longer = (n: number) => [...bacaan("rumah", "kejadian"), P("Kita dapat belajar dari banyak contoh.", "Contoh itu membantu kita memahami alasan aturan.", "Ingatlah selalu untuk bersikap jujur.", "Itulah dasar kehidupan bersama yang baik.")].map((p) => p + (n ? "" : ""));
  m.subunit = [
    { ...b1, aktivitas: { ...b1.aktivitas, jenis: "mengamati" }, formatif: [so("pg", "Pilih jawaban yang benar."), so("isian", "Isilah titik-titik."), so("uraian", "Jelaskan alasan aturan."), so("penerapan", "Bagaimana kamu bersikap jika ... ?")], pakWujud: "" },
    sub({ bacaan: longer(2), aktivitas: { jenis: "berdiskusi", judul: "Yuk, Berdiskusi", tujuan: "Kamu akan belajar bekerja sama dalam kelompok.", langkah: ["Bentuk kelompok empat orang.", "Bagi peran: pembaca, pencatat, pelapor, penjaga waktu.", "Diskusikan dua kasus."], tugas: "Tulis kesimpulan kelompok.", interaktif: false, padananCetak: "" }, formatif: [so("bs", "Benar atau salah? Beri alasan."), so("uraian", "Mengapa aturan perlu disepakati bersama?"), so("penerapan", "Situasi: ... apa keputusanmu?"), so("cocok", "Cocokkan akibat dengan tindakan.")] }, 2),
    sub({ bacaan: longer(3), aktivitas: { jenis: "menulis", judul: "Yuk, Menulis", tujuan: "Kamu akan menuliskan pendapatmu.", langkah: ["Pilih satu aturan.", "Tulis dua alasan."], tugas: "Tulis satu paragraf pendapatmu.", interaktif: false, padananCetak: "" }, formatif: [so("pg", "Pilih jawaban yang tepat."), so("uraian", "Jelaskan pendapatmu."), so("penerapan", "Apa yang akan kamu lakukan jika ... ?")] }, 3),
    sub({ bacaan: longer(4), aktivitas: { jenis: "berkarya", judul: "Yuk, Berkarya", tujuan: "Kamu akan menyelesaikan karyamu.", langkah: ["Siapkan T-Chart.", "Isi kolom aturan dan alasannya."], tugas: "Selesaikan T-Chart milikmu.", interaktif: false, padananCetak: "" }, formatif: [so("isian", "Lengkapi kalimat berikut."), so("uraian", "Jelaskan karyamu."), so("penerapan", "Bagaimana karyamu dapat kamu pakai?"), so("bs", "Benar atau salah? Beri alasan.")] }, 4),
  ];
  m.asesmenAkhir = [so("isian", "Isilah titik-titik."), so("uraian", "Jelaskan mengapa aturan penting."), so("penerapan", "Selesaikan T-Chart milikmu dan jelaskan satu baris.")];
  m.produk = { jenis: "T-Chart/tabel isian", deskripsi: "T-Chart Aturan dan Alasannya: kolom aturan dan kolom alasan, minimal lima baris.", mulaiSubunit: 2 };
  m.refleksiAkhir = ["Apa yang paling kamu ingat dari unit ini?", "Bagaimana karyamu membantumu mengerti pelajaran?", "Kebiasaan baik apa yang akan kamu lakukan?"];
  m.pintuMasuk = { sederhana: true, toleran: true, kkoSama: true, fondasi: true };
  return m;
}
