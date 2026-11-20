/**
 * Modul ajar mandiri (teks siswa) dan ceklis mutunya.
 * Sumber: Buku Saku Penyusunan Modul Ajar Mandiri v5.0: Bagian A-B (posisi, karakter), C-D (input, alur),
 * E (struktur), F (bahasa per fase), G-H (aktivitas, asesmen, pola subunit), J (cetak/digital), K (PAK), L (ceklis 14 butir).
 * Murni dan teruji. Kontrak: MOD-1 dan MOD-2 di docs/ANTI-REGRESI.md. Kode MOD-01..MOD-14 = nomor kanonik ceklis Bagian L.
 */
import type { Issue } from "../tp/model";

export type SoalJenis = "pg" | "bs" | "isian" | "uraian" | "penerapan" | "cocok";
export const SOAL_LABEL: Record<SoalJenis, string> = { pg: "Pilihan ganda", bs: "Benar/salah dengan alasan", isian: "Isian singkat", uraian: "Uraian (jelaskan, mengapa)", penerapan: "Penerapan kontekstual", cocok: "Mencocokkan/mengurutkan" };
export type Soal = { jenis: SoalJenis; teks: string; opsi: string; kunci: string };
export type AktivitasJenis = "" | "membaca" | "menulis" | "mengamati" | "berdiskusi" | "berhitung" | "berkarya";
export type FormatModul = "cetak" | "digital" | "keduanya";

export type Subunit = {
  judul: string; orientasi: string; jembatan: string;
  pemantik: string[]; bacaan: string[];
  aktivitas: { jenis: AktivitasJenis; judul: string; tujuan: string; langkah: string[]; tugas: string; interaktif: boolean; padananCetak: string };
  formatif: Soal[]; refleksi: string[]; tugasRumah: string;
  nilaiIslami: string[]; // titik integrasi nilai Islami (catatan penyusun; teksnya tertulis di bacaan/refleksi)
  pakWujud: string; // catatan penyusun: di mana dan bagaimana nilai PAK muncul sebagai cerita/aktivitas (bukan teks siswa)
};
export type ModulFields = {
  mapelId: string; grade: number; semester: 0 | 1 | 2; judul: string; format: FormatModul;
  tpId: string; jumlahTangga: number; // 0 = tidak ditautkan ke tangga scaffolding
  elemenPak: string; // dari RPM/TP; catatan penyusun, tidak tampil ke siswa
  dimensiFokus: { nama: string; wujud: string }[];
  pengantar: { salam: string; tentang: string; mengapa: string; caraPakai: string; tujuan: string; produk: string };
  asesmenAwal: { soal: Soal[]; motivasi: string };
  subunit: Subunit[];
  asesmenAkhir: Soal[];
  produk: { jenis: string; deskripsi: string; mulaiSubunit: number };
  refleksiAkhir: string[];
  glosarium: { istilah: string; arti: string }[];
  pintuMasuk: { sederhana: boolean; toleran: boolean; kkoSama: boolean; fondasi: boolean };
};
export type ModulDoc = ModulFields & { id: string; status: "draf" | "siap"; sumber?: { libraryId: string } };

export const DIMENSI_NAMA = ["Keimanan & Ketaqwaan", "Kewargaan", "Penalaran Kritis", "Kreativitas", "Kolaborasi", "Kemandirian", "Kesehatan", "Komunikasi"];
export const JENIS_PRODUK = ["T-Chart/tabel isian", "Poster/infografis", "Laporan observasi mini", "Cerita/narasi pendek", "Peta konsep", "Wawancara + catatan"];

export const emptySoal = (jenis: SoalJenis = "isian"): Soal => ({ jenis, teks: "", opsi: "", kunci: "" });
export const emptySubunit = (): Subunit => ({
  judul: "", orientasi: "", jembatan: "", pemantik: [""], bacaan: [""],
  aktivitas: { jenis: "", judul: "", tujuan: "", langkah: [""], tugas: "", interaktif: false, padananCetak: "" },
  formatif: [emptySoal("isian"), emptySoal("uraian"), emptySoal("penerapan")], refleksi: ["", ""], tugasRumah: "", nilaiIslami: [], pakWujud: "",
});
export function emptyModul(): ModulFields {
  return {
    mapelId: "", grade: 0, semester: 0, judul: "", format: "cetak", tpId: "", jumlahTangga: 0, elemenPak: "", dimensiFokus: [{ nama: "", wujud: "" }, { nama: "", wujud: "" }],
    pengantar: { salam: "", tentang: "", mengapa: "", caraPakai: "", tujuan: "", produk: "" },
    asesmenAwal: { soal: [emptySoal("pg"), emptySoal("bs"), emptySoal("isian"), emptySoal("cocok")], motivasi: "" },
    subunit: [emptySubunit(), emptySubunit(), emptySubunit()],
    asesmenAkhir: [emptySoal("isian"), emptySoal("uraian"), emptySoal("penerapan")],
    produk: { jenis: "", deskripsi: "", mulaiSubunit: 2 }, refleksiAkhir: ["", "", ""], glosarium: [],
    pintuMasuk: { sederhana: false, toleran: false, kkoSama: false, fondasi: false },
  };
}

const arr = <T,>(x: T[] | undefined, fallback: T[]): T[] => (Array.isArray(x) ? x : fallback);
/** Melengkapi dokumen lama/sebagian dengan nilai awal agar tampilan tidak rusak (DATA-1). */
export function normalizeModul(raw: Partial<ModulFields> | undefined): ModulFields {
  const e = emptyModul();
  const r = (raw ?? {}) as Partial<ModulFields>;
  const soal = (x: Soal[] | undefined, f: Soal[]) => arr(x, f).map((s) => ({ ...emptySoal(), ...s }));
  const sub = (s: Partial<Subunit>): Subunit => {
    const b = emptySubunit();
    return {
      ...b, ...s,
      pemantik: arr(s.pemantik, b.pemantik), bacaan: arr(s.bacaan, b.bacaan), refleksi: arr(s.refleksi, b.refleksi), nilaiIslami: arr(s.nilaiIslami, []),
      aktivitas: { ...b.aktivitas, ...s.aktivitas, langkah: arr(s.aktivitas?.langkah, b.aktivitas.langkah) },
      formatif: soal(s.formatif, b.formatif),
    };
  };
  return {
    ...e, ...r,
    dimensiFokus: arr(r.dimensiFokus, e.dimensiFokus).map((d) => ({ nama: d.nama ?? "", wujud: d.wujud ?? "" })),
    pengantar: { ...e.pengantar, ...r.pengantar },
    asesmenAwal: { motivasi: r.asesmenAwal?.motivasi ?? "", soal: soal(r.asesmenAwal?.soal, e.asesmenAwal.soal) },
    subunit: arr(r.subunit, e.subunit).map(sub),
    asesmenAkhir: soal(r.asesmenAkhir, e.asesmenAkhir),
    produk: { ...e.produk, ...r.produk },
    refleksiAkhir: arr(r.refleksiAkhir, e.refleksiAkhir),
    glosarium: arr(r.glosarium, []).map((g) => ({ istilah: g.istilah ?? "", arti: g.arti ?? "" })),
    pintuMasuk: { ...e.pintuMasuk, ...r.pintuMasuk },
  };
}

/** Hanya bidang modul yang ditulis; id, status, sumber ditangani terpisah (DATA-1). */
export function toStoredModul(m: ModulFields): ModulFields {
  const { mapelId, grade, semester, judul, format, tpId, jumlahTangga, elemenPak, dimensiFokus, pengantar, asesmenAwal, subunit, asesmenAkhir, produk, refleksiAkhir, glosarium, pintuMasuk } = m;
  return { mapelId, grade, semester, judul, format, tpId, jumlahTangga, elemenPak, dimensiFokus, pengantar, asesmenAwal, subunit, asesmenAkhir, produk, refleksiAkhir, glosarium, pintuMasuk };
}

// ---------- Teks siswa ----------
const soalTexts = (where: string, soal: Soal[]) => soal.flatMap((s, i) => [{ where: `${where}, soal ${i + 1}`, text: s.teks }, { where: `${where}, soal ${i + 1} (opsi)`, text: s.opsi }]);
/** Semua teks yang dibaca siswa (kunci jawaban dan catatan penyusun TIDAK termasuk). */
export function studentTexts(m: ModulFields): { where: string; text: string }[] {
  const t: { where: string; text: string }[] = [{ where: "Judul", text: m.judul }];
  for (const [k, v] of Object.entries(m.pengantar)) t.push({ where: `Pengantar (${k})`, text: v });
  t.push(...soalTexts("Asesmen awal", m.asesmenAwal.soal), { where: "Asesmen awal (motivasi)", text: m.asesmenAwal.motivasi });
  m.subunit.forEach((s, i) => {
    const w = `Subunit ${i + 1}`;
    t.push({ where: `${w}, judul`, text: s.judul }, { where: `${w}, orientasi`, text: s.orientasi }, { where: `${w}, jembatan`, text: s.jembatan });
    s.pemantik.forEach((x, j) => t.push({ where: `${w}, pemantik ${j + 1}`, text: x }));
    s.bacaan.forEach((x, j) => t.push({ where: `${w}, bacaan paragraf ${j + 1}`, text: x }));
    t.push({ where: `${w}, aktivitas`, text: [s.aktivitas.judul, s.aktivitas.tujuan, ...s.aktivitas.langkah, s.aktivitas.tugas, s.aktivitas.padananCetak].join(" ") });
    t.push(...soalTexts(`${w}, latihan`, s.formatif));
    s.refleksi.forEach((x, j) => t.push({ where: `${w}, refleksi ${j + 1}`, text: x }));
    t.push({ where: `${w}, tugas rumah`, text: s.tugasRumah });
  });
  t.push(...soalTexts("Asesmen akhir", m.asesmenAkhir), { where: "Produk (deskripsi)", text: m.produk.deskripsi }, { where: "Produk (jenis)", text: m.produk.jenis });
  m.refleksiAkhir.forEach((x, j) => t.push({ where: `Refleksi akhir ${j + 1}`, text: x }));
  m.glosarium.forEach((g, j) => t.push({ where: `Glosarium ${j + 1}`, text: `${g.istilah} ${g.arti}` }));
  return t.filter((x) => x.text.trim());
}

const L = (s: string) => s.trim().length > 0;
const sentences = (p: string) => p.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 2).length;
const faseOf = (g: number) => (g >= 1 && g <= 6 ? (g <= 2 ? "A" : g <= 4 ? "B" : "C") : null);
const SENT_RANGE = { A: [2, 3], B: [3, 4], C: [4, 6] } as const;
const TEKNIS = [/\bCP\b/, /\bTP\b/, /\bRPP\b/, /\bRPM\b/, /\bKKTP\b/, /modul ajar/i, /\bindikator\b/i, /capaian pembelajaran/i, /tujuan pembelajaran/i];
const PAK_TERM = [/\bPAK\b/, /anti-?korupsi/i, /\bkorupsi\b/i];
const terbuka = (s: Soal) => s.jenis === "uraian" || s.jenis === "penerapan";
const bobotBaca = (s: Subunit) => s.bacaan.reduce((n, p) => n + p.trim().length, 0);

export type Ctx = { islami?: boolean };

export function lintModul(m: ModulFields, ctx: Ctx = {}): Issue[] {
  const out: Issue[] = [];
  const add = (code: string, level: Issue["level"], message: string) => out.push({ code, level, message });
  const n = m.subunit.length;
  const fase = faseOf(m.grade);
  const texts = studentTexts(m);

  // MOD-00 kelengkapan komponen wajib (Bagian E)
  const miss: string[] = [];
  if (!m.mapelId || !fase) miss.push("mata pelajaran dan kelas");
  if (!L(m.judul)) miss.push("judul unit");
  for (const [k, label] of [["salam", "salam"], ["tentang", "penjelasan unit"], ["mengapa", "mengapa penting"], ["caraPakai", "cara memakai modul"], ["tujuan", "tujuan unit"]] as const) if (!L(m.pengantar[k])) miss.push(`pengantar: ${label}`);
  m.subunit.forEach((s, i) => {
    const w = `subunit ${i + 1}`;
    if (!L(s.judul)) miss.push(`${w}: judul`);
    if (!L(s.orientasi)) miss.push(`${w}: orientasi`);
    if (!L(s.aktivitas.judul) || !L(s.aktivitas.tujuan) || !s.aktivitas.langkah.some(L) || !L(s.aktivitas.tugas)) miss.push(`${w}: aktivitas inti (judul, tujuan, langkah, tugas)`);
  });
  if (m.refleksiAkhir.filter(L).length < 3 || m.refleksiAkhir.filter(L).length > 5) miss.push("refleksi akhir unit (3 sampai 5 pertanyaan)");
  if (miss.length) add("MOD-00", "error", `Komponen wajib belum lengkap: ${miss.join("; ")}.`);

  // Bahasa per fase (Bagian F)
  if (fase) {
    const [lo, hi] = SENT_RANGE[fase];
    const bad: string[] = [];
    m.subunit.forEach((s, i) => {
      if (s.bacaan.filter(L).length < 2 || s.bacaan.filter(L).length > 6) bad.push(`subunit ${i + 1}: bacaan ${s.bacaan.filter(L).length} paragraf (seharusnya 2 sampai 6)`);
      s.bacaan.filter(L).forEach((p, j) => { const c = sentences(p); if (c < lo || c > hi) bad.push(`subunit ${i + 1}, paragraf ${j + 1}: ${c} kalimat (Fase ${fase}: ${lo} sampai ${hi})`); });
    });
    if (bad.length) add("MOD-F", "warn", `Panjang bacaan belum sesuai fase. ${bad.slice(0, 4).join("; ")}${bad.length > 4 ? `; dan ${bad.length - 4} lainnya` : ""}.`);
  }

  // MOD-01 tanpa istilah teknis guru
  const hits = texts.flatMap((x) => TEKNIS.filter((re) => re.test(x.text)).map((re) => `"${x.text.match(re)![0]}" di ${x.where}`));
  if (hits.length) add("MOD-01", "error", `Teks siswa memuat istilah teknis guru: ${hits.slice(0, 3).join("; ")}${hits.length > 3 ? `; dan ${hits.length - 3} lainnya` : ""}. Tulis dalam bahasa siswa.`);

  // MOD-02 jumlah subunit
  if (m.jumlahTangga > 0 && n !== m.jumlahTangga) add("MOD-02", "error", `Jumlah subunit ${n}, sedangkan tangga scaffolding yang dirujuk ${m.jumlahTangga}. Jumlah subunit mengikuti jumlah tangga, tidak dihitung ulang.`);
  if (n < 3 || n > 6) add("MOD-02", "warn", `Jumlah subunit ${n} di luar rentang wajar 3 sampai 6. Periksa apakah CP perlu dipecah menjadi lebih dari satu unit, atau ada tangga yang dapat digabung.`);

  // MOD-03 produk belajar
  if (!L(m.produk.jenis) || !L(m.produk.deskripsi)) add("MOD-03", "error", "Tentukan Produk Belajar Unit (jenis dan deskripsi karya yang dihasilkan siswa).");
  if (!L(m.pengantar.produk)) add("MOD-03", "error", "Produk Belajar harus diumumkan eksplisit di Pengantar (mis. \"Di akhir unit ini, kamu akan membuat ...\").");
  if (n >= 3 && (m.produk.mulaiSubunit < 2 || m.produk.mulaiSubunit > Math.ceil(n / 2) + 1)) add("MOD-03", "warn", `Produk dikerjakan bertahap sejak subunit tengah. Mulai di subunit ${m.produk.mulaiSubunit} dari ${n}; rentang yang sesuai 2 sampai ${Math.ceil(n / 2) + 1}.`);
  if (!m.asesmenAkhir.some(terbuka)) add("MOD-03", "error", "Asesmen akhir unit wajib memuat minimal 1 soal terbuka atau karya (penyelesaian Produk Belajar).");

  // MOD-04 asesmen awal diagnostik
  const aw = m.asesmenAwal.soal.filter((s) => L(s.teks));
  if (aw.length < 4) add("MOD-04", "error", `Asesmen awal baru ${aw.length} soal; seharusnya 4 sampai 8 soal atau tugas dengan jawaban benar/salah.`);
  else if (aw.length > 8) add("MOD-04", "warn", `Asesmen awal ${aw.length} soal; maksimal 8 agar tidak melelahkan.`);
  if (aw.some(terbuka)) add("MOD-04", "warn", "Asesmen awal bersifat diagnostik (ada jawaban benar atau salah), bukan pemantik diskusi. Hindari soal terbuka di sini; pindahkan ke Pemantik Pengalaman subunit.");
  if (aw.some((s) => !L(s.kunci))) add("MOD-04", "warn", "Beberapa soal asesmen awal belum punya kunci jawaban untuk guru.");
  if (!/tidak dinilai/i.test(m.asesmenAwal.motivasi)) add("MOD-04", "warn", 'Tutup asesmen awal dengan paragraf motivasi yang menyatakan jawaban tidak dinilai (mis. "Jawaban kamu tadi tidak dinilai, hanya untuk membantu kita belajar bersama!").');

  // MOD-05 materi pintu masuk
  const pm = Object.values(m.pintuMasuk);
  if (pm.includes(false)) add("MOD-05", "warn", "Konfirmasi 4 kriteria Materi Pintu Masuk untuk subunit pertama: lebih sederhana, toleran terhadap ketidaksempurnaan, KKO sama dengan unit, dan fondasi langsung berguna untuk subunit puncak.");
  if (n >= 3) {
    const rest = m.subunit.slice(1).map(bobotBaca);
    if (bobotBaca(m.subunit[0]) > rest.reduce((a, b) => a + b, 0) / rest.length) add("MOD-05", "warn", "Bacaan subunit pertama lebih panjang dari rata-rata subunit lain. Subunit pertama seharusnya lebih pendek dan sederhana.");
  }

  // MOD-06 pemantik terpisah, MOD-07 formatif, MOD-08 refleksi
  const kinds: string[] = [];
  m.subunit.forEach((s, i) => {
    const w = `Subunit ${i + 1}`;
    const pem = s.pemantik.filter(L);
    if (pem.length < 1) add("MOD-06", "error", `${w}: pemantik pengalaman belum ada (1 sampai 3 pertanyaan konkret, di kotak tersendiri).`);
    else {
      if (pem.length > 3) add("MOD-06", "warn", `${w}: pemantik ${pem.length} pertanyaan; cukup 1 sampai 3.`);
      if (!pem.some((q) => q.includes("?"))) add("MOD-06", "warn", `${w}: pemantik sebaiknya berupa pertanyaan konkret yang dijawab siswa sebelum membaca.`);
    }
    if (s.orientasi.includes("?")) add("MOD-06", "warn", `${w}: orientasi memuat pertanyaan. Pindahkan ke kotak pemantik; orientasi hanya narasi singkat "Di bagian ini kamu akan belajar ...".`);

    const f = s.formatif.filter((x) => L(x.teks));
    if (f.length < 3) add("MOD-07", "error", `${w}: latihan formatif baru ${f.length} soal; seharusnya 3 sampai 8.`);
    else if (f.length > 8) add("MOD-07", "warn", `${w}: latihan formatif ${f.length} soal; maksimal 8.`);
    if (f.length && f.filter((x) => x.jenis === "pg" || x.jenis === "bs").length / f.length > 0.5) add("MOD-07", "error", `${w}: pilihan ganda dan benar/salah melebihi 50% soal formatif.`);
    if (f.length && !f.some((x) => x.jenis === "uraian")) add("MOD-07", "error", `${w}: wajib minimal 1 soal uraian (jelaskan atau mengapa).`);
    if (f.length && !f.some((x) => x.jenis === "penerapan")) add("MOD-07", "error", `${w}: wajib minimal 1 soal penerapan kontekstual.`);

    const r = s.refleksi.filter(L);
    if (r.length < 2) add("MOD-08", "error", `${w}: refleksi pribadi wajib 2 sampai 3 pertanyaan di setiap subunit (tidak digabung ke refleksi akhir).`);
    else if (r.length > 3) add("MOD-08", "warn", `${w}: refleksi pribadi ${r.length} pertanyaan; cukup 2 sampai 3.`);
    if (s.aktivitas.jenis) kinds.push(s.aktivitas.jenis);
  });

  // MOD-09 variasi antar-subunit
  const sig = (s: Subunit) => `${s.aktivitas.jenis}|${s.formatif.map((x) => x.jenis).sort().join(",")}`;
  const dup: string[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (sig(m.subunit[i]) === sig(m.subunit[j])) dup.push(`${i + 1} dan ${j + 1}`);
  if (dup.length) add("MOD-09", "warn", `Subunit ${dup.join("; ")} memiliki jenis aktivitas dan komposisi latihan yang sama. Setiap subunit punya peran dan tipe aktivitas berbeda, bukan pola "bacaan, soal" yang diulang.`);
  const set = new Set<string>([...kinds, ...(L(m.produk.jenis) ? ["berkarya"] : [])]);
  const lack = ["mengamati", "berdiskusi", "berkarya"].filter((k) => !set.has(k));
  if (lack.length) add("MOD-09", "warn", `Dalam satu unit perlu kombinasi aktivitas. Belum ada: ${lack.join(", ")}.`);
  if (m.subunit.some((s) => !s.aktivitas.jenis)) add("MOD-09", "info", "Tandai jenis aktivitas utama tiap subunit agar variasi dapat diperiksa.");
  m.subunit.slice(1).forEach((s, i) => { if (!L(s.jembatan)) add("MOD-09", "info", `Subunit ${i + 2}: kalimat jembatan yang mengaitkan subunit sebelumnya akan membantu alur.`); });

  // MOD-10 dimensi sebagai tugas konkret
  const dim = m.dimensiFokus.filter((d) => L(d.nama));
  if (dim.length < 2 || dim.length > 4) add("MOD-10", "warn", `Pilih 2 sampai 4 Dimensi Profil Lulusan yang paling relevan (saat ini ${dim.length}); jangan semua 8.`);
  if (dim.some((d) => !L(d.wujud))) add("MOD-10", "error", "Setiap dimensi harus terwujud sebagai tugas atau aktivitas konkret (tulis wujudnya), bukan sekadar label.");

  // MOD-11/12 PAK
  const pakTexts = texts.flatMap((x) => PAK_TERM.filter((re) => re.test(x.text)).map(() => x.where));
  if (pakTexts.length) add("MOD-11", "error", `Siswa tidak perlu membaca istilah PAK atau korupsi. Tulis sebagai nilai dan cerita konkret (jujur, amanah, aturan). Ditemukan di: ${[...new Set(pakTexts)].slice(0, 3).join("; ")}.`);
  const pakIsi = m.subunit.some((s) => L(s.pakWujud));
  if (L(m.elemenPak) && !pakIsi) add("MOD-11", "error", "Elemen PAK terisi: tunjukkan di subunit mana nilainya muncul sebagai cerita atau aktivitas (isi catatan PAK di subunit terkait).");
  if (!L(m.elemenPak) && pakIsi) add("MOD-12", "warn", "Elemen PAK kosong tetapi ada catatan PAK di subunit. PAK tidak dipaksakan; hapus bila tidak ada kaitan alami.");

  // MOD-13 cetak/digital
  const inter = m.subunit.map((s, i) => [s, i + 1] as const).filter(([s]) => s.aktivitas.interaktif);
  if (m.format === "cetak" && inter.length) add("MOD-13", "error", `Format cetak tidak boleh memuat elemen interaktif digital (subunit ${inter.map(([, i]) => i).join(", ")}).`);
  if (m.format === "keduanya" && inter.some(([s]) => !L(s.aktivitas.padananCetak))) add("MOD-13", "error", "Format cetak dan digital: setiap elemen interaktif harus punya padanan cetak (mis. drag-and-drop menjadi tabel isian).");

  // MOD-14 nilai Islami
  if (ctx.islami !== false) {
    const over = m.subunit.map((s, i) => [s, i + 1] as const).filter(([s]) => s.nilaiIslami.filter(L).length > 2);
    if (over.length) add("MOD-14", "warn", `Nilai Islami berlebihan di subunit ${over.map(([, i]) => i).join(", ")}: cukup 1 sampai 2 titik per subunit, tidak menggantikan konten akademis.`);
    if (m.subunit.every((s) => s.nilaiIslami.filter(L).length === 0)) add("MOD-14", "info", "Belum ada titik integrasi nilai Islami. Bila topik tidak berkaitan langsung, cukup salam atau doa di awal dan akhir.");
  }
  return out;
}

export const CEKLIS: { code: string; kriteria: string }[] = [
  { code: "MOD-01", kriteria: "Tidak ada istilah teknis (CP/TP/RPP/Modul Ajar) di teks siswa" },
  { code: "MOD-02", kriteria: "Jumlah subunit sesuai jumlah tangga scaffolding, bukan dihitung ulang" },
  { code: "MOD-03", kriteria: "Produk Belajar diumumkan di Pengantar dan dikerjakan bertahap sejak subunit tengah" },
  { code: "MOD-04", kriteria: "Asesmen awal (diagnostik) terpisah jelas dari Pemantik Pengalaman" },
  { code: "MOD-05", kriteria: "Subunit pertama memenuhi 4 kriteria Materi Pintu Masuk" },
  { code: "MOD-06", kriteria: "Pemantik Pengalaman terpisah dari paragraf pengantar" },
  { code: "MOD-07", kriteria: "Latihan formatif bervariasi: maks 50% PG, min 1 uraian, min 1 penerapan" },
  { code: "MOD-08", kriteria: "Refleksi pribadi ada di SETIAP subunit" },
  { code: "MOD-09", kriteria: "Setiap subunit punya fokus dan aktivitas berbeda" },
  { code: "MOD-10", kriteria: "2-4 Dimensi Profil Lulusan terwujud sebagai tugas konkret" },
  { code: "MOD-11", kriteria: "Bila Elemen PAK ada: muncul sebagai cerita/aktivitas tanpa istilah PAK ke siswa" },
  { code: "MOD-12", kriteria: "Bila Elemen PAK tidak ada: tidak dipaksakan" },
  { code: "MOD-13", kriteria: "Format cetak/digital konsisten; interaktif punya padanan cetak" },
  { code: "MOD-14", kriteria: "Nilai Islami 1-2 titik per subunit, tidak berlebihan" },
];
export type CeklisStatus = "lolos" | "perlu";
export const ceklisStatus = (issues: Issue[]) => CEKLIS.map((c) => ({ ...c, status: (issues.some((i) => i.code === c.code && i.level !== "info") ? "perlu" : "lolos") as CeklisStatus }));
export const countIssues = (i: Issue[]) => ({ error: i.filter((x) => x.level === "error").length, warn: i.filter((x) => x.level === "warn").length });

/** Awalan dari satu alternatif scaffolding: jumlah subunit = jumlah tangga (Bagian D.3), judul subunit dari kompetensi tangga. */
export function prefillFromScaffold(p: { tpId: string; mapelId: string; grade: number; semester: 0 | 1 | 2; elemenPak?: string; tangga: { kompetensi: string }[] }): ModulFields {
  const m = emptyModul();
  Object.assign(m, { tpId: p.tpId, mapelId: p.mapelId, grade: p.grade, semester: p.semester, jumlahTangga: p.tangga.length, elemenPak: p.elemenPak ?? "" });
  m.subunit = p.tangga.map((t) => ({ ...emptySubunit(), judul: t.kompetensi }));
  return m;
}
