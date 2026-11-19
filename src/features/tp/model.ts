/**
 * Model TP dan "telaah mutu" (linter pedagogis).
 * Sumber aturan: Buku Saku CP-ATP-TP Bagian II-V; Buku Saku Scaffolding Bagian IV, VII, XI.
 * Murni dan teruji. Kontrak: TP-1 dan TP-2 di docs/ANTI-REGRESI.md.
 *
 * Tingkat temuan: "error" memblokir status Siap; "warn" saran kuat; "info" petunjuk.
 */
export type Fase = "A" | "B" | "C";
export type UjiKey = "kerangka" | "jenjang" | "caraUkur" | "genre";
export type UjiAnswer = "" | "tidak" | "ya";

export type TpFields = {
  mapelId: string;
  grade: number; // 1-6; 0 = belum dipilih
  cpElemen: string; // "" = TP mandiri (belum dikaitkan ke elemen CP)
  semester: 0 | 1 | 2; // 0 = belum ditentukan
  kko: string;
  objek: string;
  konten: string;
  bukti: string;
  jp: number;
  tahapan: string[];
  caraAsesmen: string;
  tidakDipakai: string;
  uji: Record<UjiKey, UjiAnswer>;
};
/** Data ATP yang melekat pada TP (Buku Saku CP-ATP-TP Bagian VII): urutan, relasi, kontinuitas. */
export type AtpData = {
  urutan: number; // 0 = belum diurutkan
  alasan: string; // alasan penempatan di kelas awal/akhir fase
  prasyarat: string[]; // id TP yang harus tuntas lebih dulu
  kontinuitas: "tuntas" | "diperdalam"; // diperdalam = diulang/diperdalam lintas kelas
  catatan: string; // apa yang diulang/diperdalam
};
export const emptyAtp = (): AtpData => ({ urutan: 0, alasan: "", prasyarat: [], kontinuitas: "tuntas", catatan: "" });
export type TpDoc = TpFields & { id: string; status: "draf" | "siap"; atp?: Partial<AtpData> };

/** Hanya bidang TP yang boleh ditulis oleh penyusun TP; id, status, dan atp dijaga agar tidak tertimpa salinan lama (DATA-1). */
export function toStoredFields(t: TpFields): TpFields {
  return {
    mapelId: t.mapelId, grade: t.grade, cpElemen: t.cpElemen, semester: t.semester,
    kko: t.kko, objek: t.objek, konten: t.konten, bukti: t.bukti, jp: t.jp,
    tahapan: t.tahapan, caraAsesmen: t.caraAsesmen, tidakDipakai: t.tidakDipakai, uji: t.uji,
  };
}

export type Issue = { code: string; level: "error" | "warn" | "info"; message: string };

export const UJI: { key: UjiKey; q: string }[] = [
  { key: "kerangka", q: "Apakah TP ini menggabungkan lebih dari satu kerangka penyusunan (misalnya argumentasi dan naratif sekaligus)?" },
  { key: "jenjang", q: "Apakah ada kompetensi di dalamnya yang semestinya sudah tuntas di fase sebelumnya?" },
  { key: "caraUkur", q: "Apakah bagian-bagiannya membutuhkan instrumen asesmen yang fundamental berbeda?" },
  { key: "genre", q: "Apakah menggabungkan genre retorika yang berbeda (informatif dan performatif-ekspresif)?" },
];

export const emptyTp = (): TpFields => ({
  mapelId: "", grade: 0, cpElemen: "", semester: 0,
  kko: "", objek: "", konten: "", bukti: "",
  jp: 0, tahapan: ["", "", "", ""], caraAsesmen: "", tidakDipakai: "",
  uji: { kerangka: "", jenjang: "", caraUkur: "", genre: "" },
});

/** KKO realistis per fase (Scaffolding Bagian IV). Fase lebih tinggi boleh memakai KKO fase di bawahnya. */
const KKO_FASE: Record<Fase, string[]> = {
  A: ["mengidentifikasi", "menyebutkan", "menunjukkan", "menceritakan", "mengelompokkan"],
  B: ["menjelaskan", "membandingkan", "mengklasifikasikan", "mengurutkan", "meringkas", "menyimpulkan"],
  C: ["menganalisis", "mengevaluasi", "memprediksi", "merancang", "menyajikan", "mengkreasi"],
};
export const KKO_SUGGESTIONS = Object.values(KKO_FASE).flat().map((k) => k[0].toUpperCase() + k.slice(1)).concat(["Menulis", "Membaca", "Mendemonstrasikan"]);
const FASE_RANK: Record<Fase, number> = { A: 0, B: 1, C: 2 };
export const faseOfGrade = (g: number): Fase | null => (g >= 1 && g <= 6 ? (g <= 2 ? "A" : g <= 4 ? "B" : "C") : null);

/** Level KKO yang didefinisikan Scaffolding Bagian XI (hanya enam ini). */
export const KKO_LEVEL: Record<string, "Rendah" | "Menengah" | "Tinggi"> = {
  menyebutkan: "Rendah", mengidentifikasi: "Rendah", menjelaskan: "Menengah", membandingkan: "Menengah", menganalisis: "Tinggi", mengevaluasi: "Tinggi",
};

type AsesmenRow = { kko: string[]; sesuai: string; salah: string; bad: (cara: string) => boolean };
const has = (s: string, re: RegExp) => re.test(s.toLowerCase());
/** Peta KKO ke bentuk asesmen (Scaffolding Bagian VII). */
export const ASESMEN_MAP: AsesmenRow[] = [
  { kko: ["mengidentifikasi", "menyebutkan"], sesuai: "tes lisan, tes tertulis pilihan atau isian singkat", salah: "proyek kolase atau poster tanpa teks analitis", bad: (c) => has(c, /kolase|poster/) && !has(c, /tulis|teks|esai|laporan/) },
  { kko: ["menjelaskan", "menceritakan"], sesuai: "esai pendek, presentasi lisan, tulisan deskriptif", salah: "tes pilihan ganda", bad: (c) => has(c, /pilihan ganda/) },
  { kko: ["membandingkan", "mengklasifikasikan"], sesuai: "tabel perbandingan, tulisan argumentatif singkat, diagram terklasifikasi", salah: "proyek poster tanpa tulisan analitis", bad: (c) => has(c, /poster/) && !has(c, /tulis|teks|esai|tabel|diagram/) },
  { kko: ["menganalisis"], sesuai: "esai analitis, studi kasus tertulis, laporan dengan kesimpulan berbasis bukti", salah: "proyek tanpa tulisan analitis, hafalan", bad: (c) => has(c, /hafal/) || (has(c, /proyek/) && !has(c, /tulis|esai|laporan/)) },
  { kko: ["mengevaluasi"], sesuai: "tulisan evaluatif dengan kriteria jelas, debat terstruktur, jurnal reflektif", salah: "proyek dekoratif, tes pilihan ganda", bad: (c) => has(c, /dekoratif|pilihan ganda/) },
  { kko: ["menyajikan", "mendemonstrasikan"], sesuai: "presentasi, laporan, demonstrasi langsung, pameran hasil kerja", salah: "tes tertulis semata", bad: (c) => has(c, /tertulis|tulis/) && !has(c, /presentasi|demonstrasi|observasi|unjuk|pameran|rubrik|laporan/) },
  { kko: ["merancang", "mengkreasi"], sesuai: "penilaian kinerja dengan rubrik, produk nyata yang dinilai prosesnya", salah: "tes pilihan ganda, hafalan", bad: (c) => has(c, /pilihan ganda|hafal/) },
];
export const asesmenRowFor = (kko: string) => ASESMEN_MAP.find((r) => r.kko.includes(kko.trim().toLowerCase()));

const INSTRUMEN = /rubrik|observasi|portofolio|unjuk kerja|ceklis|checklist|draf|respons non|wawancara|presentasi|jurnal|kinerja|produk|demonstrasi|membaca nyaring|catatan|esai|laporan|tabel|studi kasus|debat/i;
const GENERIK = /soal tertulis|tes tertulis|ulangan|latihan soal|ujian|kuis/i;
const PROSES = /bandingkan|membandingkan|revisi|merevisi|berlatih|latihan|masukan|umpan balik|mengulang|diulang|refleksi|memperbaiki/i;

export function composeTp(t: Pick<TpFields, "kko" | "objek" | "konten" | "bukti">): string {
  const p = (v: string, ph: string) => v.trim().replace(/[.\s]+$/, "") || ph;
  return `Siswa harus bisa ${p(t.kko, "[kata kerja]").toLowerCase()} ${p(t.objek, "[objek]")} tentang ${p(t.konten, "[konten]")} yang dibuktikan dengan ${p(t.bukti, "[bukti]")}.`;
}

export function lintTp(t: TpFields, ctx?: { mapelFase?: Fase[] }): Issue[] {
  const out: Issue[] = [];
  const add = (code: string, level: Issue["level"], message: string) => out.push({ code, level, message });
  const fase = faseOfGrade(t.grade);
  const kko = t.kko.trim().toLowerCase();

  if (!t.mapelId || !fase) add("TP-00", "error", "Pilih mata pelajaran dan kelas lebih dulu.");
  else if (ctx?.mapelFase && !ctx.mapelFase.includes(fase)) add("TP-00", "error", `Mata pelajaran ini tidak memiliki CP untuk Fase ${fase}.`);

  // Rumusan kompetensi (Langkah 7)
  const missing = (["kko", "objek", "konten", "bukti"] as const).filter((k) => !t[k].trim());
  if (missing.length) add("TP-01", "error", `Rumusan belum lengkap: isi ${missing.join(", ")}. TP tidak boleh berhenti di hasil akhir tanpa bukti yang jelas.`);
  if (["menganalisis", "mengevaluasi"].includes(kko) && t.objek.trim() && t.objek.trim().split(/\s+/).length < 2)
    add("TP-02", "warn", `"${t.kko.trim()}" tanpa objek yang dirinci mudah turun menjadi sekadar mencatat. Sebutkan objeknya (misalnya sebab-akibat, kredibilitas, nilai-nilai).`);
  if (fase && kko) for (const f of ["A", "B", "C"] as Fase[]) if (KKO_FASE[f].includes(kko) && FASE_RANK[f] > FASE_RANK[fase])
    { add("TP-03", "warn", `"${t.kko.trim()}" biasanya baru realistis di Fase ${f}; untuk Fase ${fase} pertimbangkan KKO yang lebih sederhana.`); break; }

  // JP
  if (!Number.isInteger(t.jp) || t.jp < 1) add("TP-04", "error", "Isi JP dengan estimasi realistis (bilangan bulat, minimal 1). Jangan disalin rata dari TP lain.");

  // Tahapan proses (Bagian V)
  const steps = t.tahapan.map((s) => s.trim()).filter(Boolean);
  if (steps.length < 4) add("TP-05", "error", `Tahapan proses baru ${steps.length} langkah; minimal 4, dari titik mulai (bukan langsung hasil akhir) hingga produk atau performa akhir.`);
  else {
    if (steps.some((s) => s.length < 15)) add("TP-06", "warn", "Ada langkah yang terlalu singkat. Tulis tindakannya cukup jelas agar tidak dibaca sebagai instruksi hasil akhir.");
    if (!steps.some((s) => PROSES.test(s))) add("TP-07", "warn", "Belum ada langkah membandingkan, merevisi, atau berlatih. Proses yang baik memberi ruang memperbaiki, bukan hanya membuat.");
  }

  // Cara asesmen (Bagian III dan V; Scaffolding Bagian VII)
  const cara = t.caraAsesmen.trim();
  if (!cara) add("TP-08", "error", "Isi cara asesmen. Bentuknya harus mengikuti jenis kompetensi, bukan soal tertulis sebagai bawaan.");
  else {
    if (GENERIK.test(cara) && !INSTRUMEN.test(cara)) add("TP-09", "warn", "Cara asesmen tampak generik (soal atau ulangan tertulis). Sebutkan instrumen yang sesuai jenis kompetensinya, misalnya rubrik, observasi, atau perbandingan draf.");
    const row = asesmenRowFor(kko);
    if (row && row.bad(cara)) add("TP-10", "warn", `Untuk "${t.kko.trim()}", bentuk asesmen yang lazim sesuai: ${row.sesuai}. Yang sering salah dipilih: ${row.salah}.`);
    if (/indah|menarik|kreatif/i.test([t.objek, t.konten, t.bukti, cara].join(" ")) && !/indikator|rubrik/i.test(cara))
      add("TP-11", "warn", 'Kriteria kualitatif ("indah", "menarik", "kreatif") perlu diturunkan menjadi indikator yang dapat diajarkan dan diamati, bukan dinilai dengan rasa.');
  }
  if (cara && !t.tidakDipakai.trim()) add("TP-12", "info", "Sebutkan juga apa yang TIDAK dipakai sebagai asesmen bila relevan, supaya tafsirnya tidak melebar.");

  // Uji pemisahan (Bagian IV)
  const jawaban = Object.values(t.uji);
  if (jawaban.includes("ya")) add("TP-13", "error", "Salah satu uji pemisahan dijawab Ya: pecah menjadi TP terpisah, masing-masing dengan tahapan proses dan cara asesmen sendiri.");
  else if (jawaban.some((a) => a === "")) add("TP-14", "warn", "Uji pemisahan belum dijawab semua. Satu TP tidak boleh menggabungkan lebih dari satu kerangka, jenjang, cara ukur, atau genre.");

  if (!t.cpElemen.trim()) add("TP-15", "info", "TP ini belum dikaitkan ke elemen CP. Boleh, tetapi keterkaitan membantu menyusun alur (ATP) dan lembar telaah.");
  return out;
}

export const countLevels = (issues: Issue[]) => ({
  error: issues.filter((i) => i.level === "error").length,
  warn: issues.filter((i) => i.level === "warn").length,
});
