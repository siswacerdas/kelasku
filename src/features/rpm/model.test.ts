import { describe, expect, it } from "vitest";
import { emptyTp, type TpDoc } from "../tp/model";
import { alokasiMenit, ceklisStatus, emptyRpm, emptyKktp, lintRpm, maybeMultiAction, normalizeRpm, prefillFromTp, toStoredRpm, totalMenit, type Row, type RpmFields } from "./model";

const R = (waktu: number, kegiatan: string, catatan = ""): Row => ({ waktu, kegiatan, catatan });
const ad = (c: string, l: string, p: string) => ({ cepat: c, lambat: l, pemalu: p });
const tp = (o: Partial<TpDoc> = {}): TpDoc => ({ ...emptyTp(), id: "tp1", status: "siap", mapelId: "ppkn", grade: 5, kko: "Menjelaskan", objek: "alasan aturan", konten: "norma", bukti: "tulisan singkat", jp: 2, caraAsesmen: "esai pendek dengan rubrik", ...o });

/** Contoh "Norma dan Aturan, Fase C" dari Buku Saku RPM v3 Bagian III (contoh teruji): harus lolos tanpa error dan saran. */
function lengkap(): RpmFields {
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
const codes = (r: RpmFields, ctx = {}) => lintRpm(r, { school: { name: "SD X", principalName: "Y" }, teacherName: "Z", ...ctx }).map((i) => i.code);

describe("lintRpm (RPM-1: contoh teruji buku saku harus lolos)", () => {
  it("RPM lengkap dari contoh buku saku lolos tanpa error dan saran", () => {
    const iss = lintRpm(lengkap(), { tp: tp(), school: { name: "SD X", principalName: "Y" }, teacherName: "Z" });
    expect(iss.filter((i) => i.level !== "info")).toEqual([]);
    expect(totalMenit(lengkap())).toBe(alokasiMenit(lengkap()));
  });
  it("kerangka kosong ditandai error pada bagian wajib", () => {
    const c = codes(emptyRpm());
    for (const k of ["RPM-01", "RPM-02", "RPM-03", "RPM-06", "RPM-10", "RPM-12", "RPM-13", "RPM-14", "RPM-15", "RPM-16"]) expect(c).toContain(k);
  });
});

describe("lintRpm (RPM-2: aturan per butir)", () => {
  it("total waktu harus sama dengan alokasi; waktu wajib di tiap baris", () => {
    const r = lengkap(); r.c.penutup[0].waktu = 5;
    expect(lintRpm(r).find((i) => i.code === "RPM-08")?.message).toMatch(/Lebih 3/);
    const r2 = lengkap(); r2.c.penutup[1].waktu = 0;
    expect(lintRpm(r2).some((i) => i.code === "RPM-08" && /wajib terisi/.test(i.message))).toBe(true);
  });
  it("ritual pembuka dan penutup wajib; tergabung dengan apersepsi diberi saran", () => {
    const r = lengkap(); r.c.pendahuluan = r.c.pendahuluan.filter((x) => !/salam/.test(x.kegiatan));
    expect(lintRpm(r).find((i) => i.code === "RPM-10")?.level).toBe("error");
    const g = lengkap(); g.c.pendahuluan[0].kegiatan = "Guru mengucap salam, berdoa, lalu menyampaikan tujuan pembelajaran hari ini.";
    expect(lintRpm(g).some((i) => i.code === "RPM-10" && /tergabung/.test(i.message))).toBe(true);
  });
  it("uji granularitas: baris yang menggabung banyak tindakan diberi saran", () => {
    expect(maybeMultiAction("Guru menjelaskan materi, memberi contoh, dan bertanya jawab dengan siswa.")).toBe(true);
    expect(maybeMultiAction("Guru menjelaskan materi lalu memberi contoh.")).toBe(true);
    expect(maybeMultiAction("Siswa berdiskusi dalam kelompok; guru berkeliling memantau dan menjawab pertanyaan.")).toBe(false);
  });
  it('"Langkah N" diberi saran', () => {
    const r = lengkap(); r.c.memahami[0].kegiatan = "Langkah 1: Guru membacakan cerita.";
    expect(codes(r)).toContain("RPM-07");
  });
  it("catatan tanpa alasan atau terisi di hampir semua baris diberi saran", () => {
    const r = lengkap(); r.c.memahami[0].catatan = "Bermakna";
    expect(lintRpm(r).some((i) => i.code === "RPM-11" && /belum menyebut prinsip/.test(i.message))).toBe(true);
    const r2 = lengkap(); for (const t of ["pendahuluan", "memahami", "mengaplikasi", "merefleksi", "penutup"] as const) r2.c[t].forEach((x) => { x.catatan = "🔎 Berkesadaran: siswa tahu alasan baris ini dilakukan."; });
    expect(lintRpm(r2).some((i) => i.code === "RPM-11" && /hampir di semua/.test(i.message))).toBe(true);
  });
  it("dimensi: 8 baris dan 2-3 bintang", () => {
    const r = lengkap(); r.b.dimensi[0].dominan = true; r.b.dimensi[3].dominan = true;
    expect(lintRpm(r).some((i) => i.code === "RPM-03" && /saat ini 4/.test(i.message))).toBe(true);
  });
  it("adaptasi tiga kategori wajib di tiap tahap inti", () => {
    const r = lengkap(); r.c.adaptasi.merefleksi.pemalu = "";
    expect(lintRpm(r).find((i) => i.code === "RPM-06")?.message).toMatch(/Merefleksi/);
  });
  it("status sumatif: formatif butuh peran, sumatif butuh instrumen sesuai KKO", () => {
    const r = lengkap(); r.d.sumatif = { status: "formatif", peran: "", instrumen: "" };
    expect(lintRpm(r).some((i) => i.code === "RPM-13" && i.level === "error")).toBe(true);
    const s = lengkap(); s.d.sumatif = { status: "sumatif", peran: "", instrumen: "tes pilihan ganda" };
    expect(lintRpm(s, { tp: tp({ kko: "Menjelaskan" }) }).some((i) => i.code === "RPM-13" && i.level === "warn")).toBe(true);
  });
  it("rubrik: butuh minimal satu jenis, masing-masing 4 level", () => {
    const r = lengkap(); r.d.rubrikPengetahuan = [];
    expect(codes(r)).toContain("RPM-14");
    const s = lengkap(); s.d.rubrikPengetahuan[0].l4 = "";
    expect(codes(s)).toContain("RPM-14");
  });
  it("KKTP harus terisi empat kolom", () => {
    const r = lengkap(); r.d.kktp = [emptyKktp()];
    expect(codes(r)).toContain("RPM-16");
  });
  it("PAK: isi harus konsisten; bila kosong tidak boleh ada sisa kolom PAK", () => {
    const r = lengkap(); r.a.elemenPak = "Ketaatan pada Aturan";
    const c = lintRpm(r).filter((i) => i.code === "RPM-17");
    expect(c.length).toBeGreaterThanOrEqual(3);
    const s = lengkap(); s.d.observasi.kolomPak = true;
    expect(lintRpm(s).some((i) => i.code === "RPM-18")).toBe(true);
  });
  it("data kop belum lengkap hanya memberi petunjuk", () => {
    expect(lintRpm(lengkap()).find((i) => i.code === "RPM-19")?.level).toBe("info");
  });
  it("audit mandiri yang belum dicentang memberi saran dan status 'belum'", () => {
    const r = lengkap(); r.konfirmasi.fase = false;
    const iss = lintRpm(r, { school: { name: "a", principalName: "b" }, teacherName: "c" });
    expect(iss.some((i) => i.code === "RPM-05")).toBe(true);
    const st = ceklisStatus(iss, r);
    expect(st).toHaveLength(19);
    expect(st.find((x) => x.code === "RPM-05")?.status).toBe("belum");
    expect(st.find((x) => x.code === "RPM-01")?.status).toBe("lolos");
  });
});

describe("normalizeRpm, toStoredRpm, prefillFromTp (DATA-1)", () => {
  it("dokumen sebagian dilengkapi nilai awal", () => {
    const n = normalizeRpm({ topik: "X", c: { pendahuluan: [{ waktu: 2, kegiatan: "a" } as Row] } as never });
    expect(n.c.memahami).toHaveLength(1);
    expect(n.c.pendahuluan[0].catatan).toBe("");
    expect(n.b.dimensi).toHaveLength(8);
    expect(n.d.observasi.perilaku).toEqual([""]);
  });
  it("hanya bidang RPM yang ditulis", () => {
    const stored = toStoredRpm({ ...lengkap(), id: "x", status: "siap" } as never) as Record<string, unknown>;
    for (const k of ["id", "status", "sumber"]) expect(stored).not.toHaveProperty(k);
  });
  it("awalan dari TP mengisi tautan, mapel, kelas, TP tahunan, dan CP", () => {
    const r = prefillFromTp(tp(), "Teks CP");
    expect(r).toMatchObject({ tpId: "tp1", mapelId: "ppkn", grade: 5 });
    expect(r.b.cp).toBe("Teks CP");
    expect(r.b.tpTahunan).toMatch(/^menjelaskan/);
  });
});
