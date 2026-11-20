/** Contoh "Norma dan Aturan" dari Buku Saku RPM v3 sebagai RPM acuan (dipakai uji ceklis dan uji pembuat RPM AI). */
import { emptyRpm, type Row, type RpmFields } from "./model";

const R = (waktu: number, kegiatan: string, catatan = ""): Row => ({ waktu, kegiatan, catatan });
const ad = (c: string, l: string, p: string) => ({ cepat: c, lambat: l, pemalu: p });
/** Contoh "Norma dan Aturan, Fase C" dari Buku Saku RPM v3 Bagian III (contoh teruji): harus lolos tanpa error dan saran. */
export function lengkap(): RpmFields {
  const r = emptyRpm();
  Object.assign(r, { mapelId: "ppkn", grade: 5, semester: 1, topik: "Norma dan aturan", jp: 1, menitPerJp: 49, pertemuanKe: 1, dariPertemuan: 2 });
  r.a = { pengetahuanAwal: "Sudah mengenal aturan kelas", minat: "Suka bercerita", gayaBelajar: "Campuran", kebutuhan: "Dua siswa lambat membaca", implikasi: "Sediakan gambar pendamping", esensial: "Aturan sebagai kesepakatan bersama", aplikatif: "Antre dan piket", nilaiKarakter: "Disiplin dan adil", elemenPak: "", relevansi: "Terjadi setiap hari di sekolah", kesulitan: "Sedang" };
  r.b = {
    cp: "Siswa memahami norma dan aturan dalam kehidupan bersama.", tpTahunan: "Menjelaskan alasan norma dan aturan dalam kehidupan bersama", tpHarian: "Menjelaskan mengapa aturan disepakati bersama",
    indikator: ["Menyebut dua dampak pelanggaran aturan", "Menjelaskan alasan aturan dengan kata sendiri"], elemenPak: "", konteks: "Antrean di sekolah", praktik: "Think-Pair-Share, cocok untuk Fase C yang mulai bernalar sebab-akibat", kemitraan: "Tidak relevan", lingkungan: "Kelas dengan papan tulis dan kertas skenario",
    dimensi: [["Keimanan & Ketakwaan", "Jujur menaati aturan", false], ["Kewargaan", "Memahami hak dan kewajiban", true], ["Penalaran Kritis", "Menalar dampak aturan", true], ["Kreativitas", "Menyusun skenario", false], ["Kolaborasi", "Diskusi kelompok", false], ["Kemandirian", "Menulis jawaban sendiri", false], ["Kesehatan", "Duduk tenang saat refleksi", false], ["Komunikasi", "Menyampaikan hasil diskusi", false]].map(([nama, catatan, dominan]) => ({ nama: nama as string, catatan: catatan as string, dominan: dominan as boolean })),
  };
  r.c.pendahuluan = [
    R(1, "Guru mengucap salam dan mengajak siswa berdoa bersama (menunjuk salah satu siswa memimpin doa)."),
    R(2, "Guru memeriksa kehadiran siswa satu per satu sambil menyapa singkat."),
    R(3, "Guru mengajukan pertanyaan pemantik: 'Coba bayangkan sehari di sekolah tanpa ada aturan apapun, apa yang mungkin terjadi?' Siswa menjawab bergiliran secara lisan.", "😊 Menggembirakan: pertanyaan terbuka dan ringan, bukan langsung masuk materi."),
    R(2, "Guru mengaitkan jawaban siswa dengan pengalaman nyata di sekolah (mis. antre, piket, jam masuk kelas), menuliskan 2-3 contoh yang disebut siswa di papan tulis.", "💡 Bermakna: memakai contoh yang benar-benar disebut siswa, bukan contoh generik dari guru."),
    R(1, "Guru menyampaikan tujuan pembelajaran hari ini dengan kalimat sederhana: 'Hari ini kita akan belajar apa itu norma dan kenapa norma penting bagi kehidupan kita bersama.'", "🔎 Berkesadaran: siswa tahu persis arah pembelajaran sebelum masuk ke materi."),
  ];
  r.c.memahami = [
    R(3, "Guru membacakan cerita pendek tentang seorang siswa yang melanggar aturan antre dan dampaknya terhadap teman-temannya."),
    R(2, "Guru bertanya: 'Apa yang dirasakan teman-teman yang diserobot antreannya?' Siswa menjawab lisan."),
    R(1, "Guru mencatat kata kunci dari jawaban siswa di papan tulis (kesal, tidak adil, dirugikan).", "🔎 Berkesadaran: siswa diajak menyadari dampak konkret dari pelanggaran aturan, bukan dihafal sebagai konsep abstrak."),
    R(3, "Guru menjelaskan konsep 'aturan sebagai kesepakatan bersama' menggunakan kata kunci yang tadi disebut siswa."),
    R(2, "Guru mengaitkan penjelasan tadi dengan 3 contoh aturan yang sudah ditulis di Pendahuluan, satu per satu."),
  ];
  r.c.mengaplikasi = [
    R(2, "Guru membagi siswa ke dalam kelompok kecil (3-4 orang) dengan menyebut nomor urut tempat duduk."),
    R(1, "Guru membagikan satu kertas skenario pelanggaran aturan di sekolah ke tiap kelompok (skenario berbeda per kelompok)."),
    R(1, "Guru menjelaskan instruksi diskusi: tiap kelompok menjawab dua pertanyaan di kertas skenario, apa dampak pelanggaran itu dan apa yang seharusnya dilakukan sesuai aturan."),
    R(7, "Siswa berdiskusi dalam kelompok; guru berkeliling memantau dan menjawab pertanyaan tiap kelompok bila diperlukan.", "💡 Bermakna: skenario kasus diambil dari situasi yang benar-benar mungkin terjadi di sekolah ini."),
    R(4, "Perwakilan tiap kelompok menyampaikan hasil diskusi secara singkat (1 menit per kelompok) ke seluruh kelas."),
  ];
  r.c.merefleksi = [
    R(1, "Guru mengajak siswa duduk tenang di tempat masing-masing, menandai transisi dari diskusi aktif ke sesi refleksi.", "😊 Menggembirakan: perubahan suasana fisik menandai transisi dari diskusi aktif ke refleksi tenang."),
    R(1, "Guru mengajukan 2 pertanyaan reflektif secara lisan: 'Aturan apa di sekolah yang menurutmu paling penting? Kenapa?'"),
    R(3, "Siswa menuliskan jawaban singkat di buku catatan."),
    R(3, "2-3 siswa (sukarela) membacakan jawabannya ke kelas."),
    R(1, "Guru menutup sesi dengan menegaskan bahwa aturan ada untuk melindungi semua orang, bukan untuk membatasi kebebasan."),
  ];
  r.c.penutup = [
    R(2, "Guru mengajak 1-2 siswa menyimpulkan poin utama hari ini dengan kalimat sendiri; guru menguatkan atau meluruskan bila perlu."),
    R(1, "Guru menyampaikan jembatan ke pertemuan berikutnya: 'Minggu depan kita akan belajar bagaimana aturan ini juga berlaku di luar sekolah.'"),
    R(1, "Guru menyampaikan tugas atau tindak lanjut jika ada, atau menyatakan eksplisit tidak ada tugas rumah."),
    R(1, "Guru menutup pelajaran dengan mengajak siswa berdoa dan mengucap salam penutup."),
  ];
  r.c.adaptasi = {
    memahami: ad("Beri pertanyaan lanjutan tentang aturan yang dibuat satu orang", "Ulangi baris pertama dengan media gambar", "Baris ke-2 boleh dijawab tertulis dulu"),
    mengaplikasi: ad("Beri skenario tambahan yang lebih kompleks", "Guru mendampingi langsung dengan pertanyaan pemandu", "Perwakilan boleh membacakan dari catatan tertulis"),
    merefleksi: ad("Tambah pertanyaan aturan mana yang perlu diperbaiki", "Ganti dengan pertanyaan ya/tidak berpandu", "Jawaban tertulis cukup, tidak wajib dibacakan"),
  };
  r.d.diagnostik = { tugas: "Tulis satu aturan di rumah dan alasannya (5 menit)", cara: "Lihat apakah alasan disebut", tindakLanjut: "Siswa tanpa alasan didampingi di diskusi" };
  r.d.formatif = { minimal: "Menyebut satu dampak pelanggaran aturan", standar: "Menjelaskan dua dampak dan alasan aturan", lanjutan: "Mengusulkan perbaikan aturan dengan alasan" };
  r.d.sumatif = { status: "formatif", peran: "Pertemuan ke-2 membawa asesmen sumatif", instrumen: "" };
  r.d.rubrikPengetahuan = [{ aspek: "Penjelasan alasan aturan", l1: "Belum menyebut alasan", l2: "Menyebut satu alasan", l3: "Menjelaskan alasan dengan contoh", l4: "Menjelaskan dengan contoh dan usulan" }];
  r.d.observasi = { perilaku: ["Menyimak teman", "Menyampaikan pendapat"], kolomPak: false };
  r.d.kktp = [{ jenis: "Pengetahuan", level: "Berkembang Sesuai Harapan", deskriptor: "Menjelaskan alasan aturan dengan contoh", bukti: "Tulisan refleksi" }];
  r.konfirmasi = { kreativitas: true, fase: true, guruPengganti: true, inklusif: true };
  return r;
}
