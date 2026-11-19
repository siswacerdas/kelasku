/**
 * Tangga pertemuan (scaffolding) per TP per rombel.
 * Sumber: Buku Saku Scaffolding SD v2: Bagian II (Peta Keputusan), VI (Alat 1-3), VII, VIII (titik gagal 1A-1J), IX (struktur output Blok 0-3).
 * Murni dan teruji. Kontrak: SC-1 dan SC-2 di docs/ANTI-REGRESI.md.
 */
import { asesmenRowFor, composeTp, type Issue, type TpDoc } from "../tp/model";
import { resolveProfile, type Profile, type ProfileKey, type Resolved } from "../profil/profile";

export type Bobot = "wajib" | "ideal" | "pengayaan";
export type Bantuan = "" | "penuh" | "sedang" | "sedikit" | "tanpa";
export type Skala = "" | "individu" | "kelompok-kecil" | "kelompok-sedang" | "kelas";
export type Media = "" | "cetak" | "benda" | "lisan" | "digital";
export type JenisAlt = "bertahap-tunggal" | "kontras-berpasangan" | "lain";
export type Ans = "" | "ya" | "tidak";

export type Tangga = {
  kompetensi: string; materi: string; mengapa: string; tandaBerhasil: string;
  bobot: Bobot; bantuan: Bantuan; skala: Skala; media: Media;
  persiapanGuru: string; kalimatPembuka: string; diamati: string; jikaBelum: string;
};
export type Alternatif = { nama: string; jenis: JenisAlt; rasional: string; uji: { sederhana: Ans; fondasi: Ans; cukup: Ans }; tangga: Tangga[] };
export type Konten = { konten: string; status: "WAJIB" | "PILIHAN" };

export type ScaffoldFields = {
  tpId: string;
  classId: string;
  analisis: { kkoMakna: string; buktiTercapai: string; bukanTermasuk: string; prasyarat: string; materiTerpilih: string; alasanMateri: string; konten: Konten[] };
  diagnostik: { tugas: string; caraMembaca: string; keputusanAwal: string };
  alternatif: Alternatif[];
  inti: { kompetensi: string; materiPuncak: string; bentukAsesmen: string; instrumen: string };
  rangsangan: "" | "bersama" | "pribadi" | "tidak-relevan";
  objekPengamatan: "" | "dalam-kelas" | "luar-kelas" | "tidak-relevan";
  jpPerPertemuan: number;
  profilHash: string;
};
export type ScaffoldDoc = ScaffoldFields & { id: string; status: "draf" | "siap" };

export const scaffoldId = (tpId: string, classId: string) => `${tpId}_${classId}`;

export const emptyTangga = (): Tangga => ({
  kompetensi: "", materi: "", mengapa: "", tandaBerhasil: "", bobot: "wajib", bantuan: "", skala: "", media: "",
  persiapanGuru: "", kalimatPembuka: "", diamati: "", jikaBelum: "",
});
export const emptyAlt = (jenis: JenisAlt = "bertahap-tunggal", nama = ""): Alternatif => ({
  nama, jenis, rasional: "", uji: { sederhana: "", fondasi: "", cukup: "" }, tangga: [emptyTangga()],
});

function blankScaffold(tpId: string, classId: string): ScaffoldFields {
  return {
    tpId, classId,
    analisis: { kkoMakna: "", buktiTercapai: "", bukanTermasuk: "", prasyarat: "", materiTerpilih: "", alasanMateri: "", konten: [] },
    diagnostik: { tugas: "", caraMembaca: "", keputusanAwal: "" },
    alternatif: [emptyAlt("bertahap-tunggal", "Alternatif 1"), emptyAlt("kontras-berpasangan", "Alternatif 2")],
    inti: { kompetensi: "", materiPuncak: "", bentukAsesmen: "", instrumen: "" },
    rangsangan: "", objekPengamatan: "", jpPerPertemuan: 2, profilHash: "",
  };
}

/** Kerangka awal untuk satu TP: dua alternatif (bertahap tunggal dan kontras berpasangan), inti terisi dari TP. */
export function newScaffold(tp: TpDoc, classId: string): ScaffoldFields {
  const s = blankScaffold(tp.id, classId);
  s.inti = { kompetensi: composeTp(tp).replace(/^Siswa harus bisa /, ""), materiPuncak: "", bentukAsesmen: tp.caraAsesmen, instrumen: "" };
  return s;
}

/** Melengkapi dokumen lama/sebagian dengan nilai awal agar tampilan tidak rusak (DATA-1). */
export function normalizeScaffold(raw: Partial<ScaffoldFields> & { id?: string; status?: string }): ScaffoldFields {
  const base = blankScaffold(raw.tpId ?? "", raw.classId ?? "");
  const alt = (raw.alternatif ?? base.alternatif).map((a) => ({ ...emptyAlt(), ...a, uji: { ...emptyAlt().uji, ...a.uji }, tangga: (a.tangga ?? []).map((t) => ({ ...emptyTangga(), ...t })) }));
  return {
    ...base, ...raw,
    analisis: { ...base.analisis, ...raw.analisis, konten: raw.analisis?.konten ?? [] },
    diagnostik: { ...base.diagnostik, ...raw.diagnostik },
    inti: { ...base.inti, ...raw.inti },
    alternatif: alt,
    tpId: raw.tpId ?? "", classId: raw.classId ?? "",
  };
}

/** Hanya bidang scaffold yang boleh ditulis penyusun (id dan status ditangani terpisah). */
export function toStoredScaffold(s: ScaffoldFields): ScaffoldFields {
  const { tpId, classId, analisis, diagnostik, alternatif, inti, rangsangan, objekPengamatan, jpPerPertemuan, profilHash } = s;
  return { tpId, classId, analisis, diagnostik, alternatif, inti, rangsangan, objekPengamatan, jpPerPertemuan, profilHash };
}

export const ALL_KEYS: ProfileKey[] = ["lokasi", "digital", "kemampuan", "kesenjangan", "percayaDiri"];
/** Profil gabungan: profil sekolah dan profil kelas (kunci tidak bertabrakan). */
export const mergedProfile = (school: Profile | undefined, kelas: Profile | undefined): Resolved[] =>
  resolveProfile(ALL_KEYS, { ...school, ...kelas });
export const profileHash = (r: Resolved[]) => r.map((x) => `${x.key}:${x.answer}:${x.source}`).join("|");

const BANTUAN_RANK: Record<Exclude<Bantuan, "">, number> = { penuh: 3, sedang: 2, sedikit: 1, tanpa: 0 };
const PERFORMATIF = /presentasi|tampil|deklamasi|pidato|berbicara|menyajikan|mendemonstrasikan/i;

export function lintScaffold(s: ScaffoldFields, ctx: { tp: TpDoc | undefined; profile: Resolved[]; profilHashNow: string }): Issue[] {
  const out: Issue[] = [];
  const add = (code: string, level: Issue["level"], message: string) => out.push({ code, level, message });
  const ans = (k: ProfileKey) => ctx.profile.find((r) => r.key === k)?.answer;
  const { tp } = ctx;

  if (!tp) add("SC-00", "error", "TP untuk tangga ini tidak ditemukan (mungkin sudah dihapus).");
  else if (tp.status !== "siap") add("SC-00", "warn", "TP ini masih berstatus draf. Tangga sebaiknya disusun dari TP yang sudah lolos telaah mutu.");
  if (s.profilHash && s.profilHash !== ctx.profilHashNow) add("SC-07", "warn", "Profil sekolah atau kelas berubah sejak tangga ini disusun. Tinjau ulang keputusan yang dipengaruhi profil (peta keputusan di samping).");

  // Blok 1 (titik gagal 1A, 1B, 1C)
  const a = s.analisis;
  if (!a.materiTerpilih.trim() || !a.alasanMateri.trim()) add("SC-01", "error", "Isi materi terpilih beserta alasannya, tertaut pada peta keputusan profil. Pilih materi yang paling alami memunculkan bukti kompetensi, bukan yang paling familiar.");
  const lackA = [["makna KKO", a.kkoMakna], ["bukti tercapai", a.buktiTercapai], ["yang bukan termasuk kompetensi ini", a.bukanTermasuk]].filter(([, v]) => !v.trim()).map(([k]) => k);
  if (lackA.length) add("SC-02", "warn", `Analisis TP belum memuat: ${lackA.join(", ")}. Tampilkan KKO terpisah dari konten supaya batasnya jelas (titik gagal 1A, 1B).`);
  if (a.konten.length === 0) add("SC-03", "warn", "Tandai tiap konten yang disebut TP sebagai WAJIB atau PILIHAN (titik gagal 1C).");

  // Blok 2
  if (!s.diagnostik.tugas.trim()) add("SC-04", "error", "Isi tugas diagnostik awal (instruksi lengkap, 10 sampai 15 menit).");
  if (!s.diagnostik.caraMembaca.trim() || !s.diagnostik.keputusanAwal.trim()) add("SC-05", "warn", "Lengkapi cara membaca hasil diagnostik dan keputusan awal (mulai dari tangga mana bila sudah bisa atau belum).");

  // Blok 3
  if (s.alternatif.length < 2) add("SC-06", "error", "Sediakan minimal 2 alternatif scaffolding, masing-masing dengan rasional kapan cocok dipakai.");

  const heterogen = ans("kemampuan") === "B";
  if (heterogen && !s.alternatif.some((x) => x.jenis === "bertahap-tunggal"))
    add("SC-08", "warn", "Kelas ini heterogen: peta keputusan memprioritaskan alternatif bertahap tunggal (satu jalur, bantuan menyusut). Sertakan setidaknya satu.");

  const performatif = !!tp && (["menyajikan", "mendemonstrasikan"].includes(tp.kko.trim().toLowerCase()) || PERFORMATIF.test(`${tp.bukti} ${tp.caraAsesmen}`));
  const jpTp = tp?.jp ?? 0;
  const jpp = s.jpPerPertemuan;
  if (!Number.isInteger(jpp) || jpp < 1) add("SC-09", "error", "Isi JP per pertemuan (bilangan bulat, minimal 1).");

  s.alternatif.forEach((alt, ai) => {
    const nm = `Alternatif ${ai + 1}`;
    if (!alt.rasional.trim()) add("SC-10", "error", `${nm}: isi rasional. Tulis dalam bentuk "cocok jika ..." berdasarkan profil kelas.`);
    else if (!/jika|apabila|bila/i.test(alt.rasional)) add("SC-10", "warn", `${nm}: rasional sebaiknya menyebut kondisi spesifik ("cocok jika ...") agar guru tahu kapan memilihnya.`);
    if (alt.tangga.length === 0) { add("SC-11", "error", `${nm}: belum ada tangga.`); return; }

    const bad: string[] = [];
    alt.tangga.forEach((t, ti) => {
      const miss = [["kompetensi", t.kompetensi], ["materi", t.materi], ["mengapa tangga ini ada", t.mengapa], ["tanda keberhasilan", t.tandaBerhasil]].filter(([, v]) => !v.trim()).map(([k]) => k);
      if (miss.length) bad.push(`tangga ${ti + 1} (${miss.join(", ")})`);
    });
    if (bad.length) add("SC-11", "error", `${nm}: lengkapi ${bad.join("; ")}.`);

    const noGuide = alt.tangga.map((t, i) => [t, i + 1] as const).filter(([t]) => !t.persiapanGuru.trim() || !t.kalimatPembuka.trim() || !t.diamati.trim() || !t.jikaBelum.trim()).map(([, i]) => i);
    if (noGuide.length) add("SC-12", "warn", `${nm}: panduan langkah pertama belum lengkap di tangga ${noGuide.join(", ")} (persiapan guru, kalimat pembuka, yang diamati, langkah jika belum berhasil).`);

    if (!alt.tangga.some((t) => t.bobot === "wajib")) add("SC-13", "warn", `${nm}: tidak ada tangga berbobot wajib. Tentukan prasyarat sejati: tanpa menguasainya, siswa tidak bisa mempelajari tangga berikutnya.`);

    const u = Object.values(alt.uji);
    if (u.includes("tidak")) add("SC-14", "error", `${nm}: salah satu uji validitas dijawab Tidak. Perbaiki: tambah tangga perantara atau susun ulang agar tangga lebih sederhana, saling membantu, dan cukup.`);
    else if (u.includes("")) add("SC-14", "warn", `${nm}: uji validitas tangga (kesederhanaan, fondasi, kecukupan) belum dijawab semua.`);

    const rank = alt.tangga.map((t, i) => [t.bantuan, i + 1] as const).filter(([b]) => b !== "") as [Exclude<Bantuan, "">, number][];
    for (let i = 1; i < rank.length; i++) if (BANTUAN_RANK[rank[i][0]] > BANTUAN_RANK[rank[i - 1][0]]) {
      add("SC-15", "warn", `${nm}: bantuan membesar di tangga ${rank[i][1]}. Bantuan harus menyusut seiring pertemuan, bukan kerangka isian yang makin rumit (titik gagal 1H).`);
      break;
    }
    if (alt.tangga.some((t) => /indah|menarik|kreatif/i.test(t.tandaBerhasil) && !/indikator/i.test(t.tandaBerhasil)))
      add("SC-16", "warn", `${nm}: tanda keberhasilan memakai kriteria kualitatif ("indah", "menarik", "kreatif"). Turunkan menjadi indikator yang dapat diajarkan dan diamati (titik gagal 1F).`);
    if (ans("digital") === "B" && alt.tangga.some((t) => t.media === "digital"))
      add("SC-17", "warn", `${nm}: ada tangga bermedia digital, padahal fasilitas digital terbatas. Fokus pada teks cetak, benda nyata, dan interaksi lisan, atau ubah jawaban profil bila memang memadai.`);
    if (performatif && ans("percayaDiri") === "B") {
      const k = alt.tangga.findIndex((t) => t.skala === "kelompok-kecil");
      const b = alt.tangga.findIndex((t) => t.skala === "kelas");
      if (k < 0 || (b >= 0 && b < k)) add("SC-18", "warn", `${nm}: siswa masih perlu pembiasaan tampil. Tambahkan tangga tampil di kelompok kecil sebelum kelas besar.`);
    }
    const wajib = alt.tangga.filter((t) => t.bobot === "wajib").length;
    const ideal = alt.tangga.filter((t) => t.bobot === "ideal").length;
    if (jpTp > 0 && jpp >= 1) {
      if ((wajib + 1) * jpp > jpTp) add("SC-19", "warn", `${nm}: ${wajib} tangga wajib ditambah pertemuan inti memerlukan ${(wajib + 1) * jpp} JP, melebihi ${jpTp} JP pada TP. Kurangi tangga atau sesuaikan JP.`);
      else if ((wajib + ideal + 1) * jpp > jpTp) add("SC-19", "info", `${nm}: bila semua tangga ideal dijalankan butuh ${(wajib + ideal + 1) * jpp} JP (TP: ${jpTp} JP). Tangga ideal bisa ditunda.`);
    }
  });

  // Pertemuan inti
  const lackI = [["kompetensi", s.inti.kompetensi], ["materi puncak", s.inti.materiPuncak], ["bentuk asesmen", s.inti.bentukAsesmen], ["instrumen asesmen singkat", s.inti.instrumen]].filter(([, v]) => !v.trim()).map(([k]) => k);
  if (lackI.length) add("SC-20", "error", `Pertemuan inti belum memuat: ${lackI.join(", ")}.`);
  const row = tp ? asesmenRowFor(tp.kko) : undefined;
  if (row && s.inti.bentukAsesmen.trim() && row.bad(s.inti.bentukAsesmen))
    add("SC-21", "warn", `Untuk "${tp?.kko}", bentuk asesmen yang lazim sesuai: ${row.sesuai}. Yang sering salah dipilih: ${row.salah}.`);

  // Peta keputusan: rangsangan dan objek pengamatan
  if (ans("kesenjangan") === "A" && s.rangsangan === "pribadi")
    add("SC-22", "error", "Kesenjangan latar belakang signifikan: wajib memakai rangsangan bersama (gambar, situasi, atau cerita yang sama untuk seluruh kelas), bukan pengalaman pribadi siswa (titik gagal 1G).");
  else if (s.rangsangan === "") add("SC-22", "info", "Tentukan bentuk rangsangan: bersama untuk seluruh kelas, pengalaman pribadi, atau tidak relevan bagi TP ini.");
  if (ans("lokasi") === "A" && s.objekPengamatan === "luar-kelas")
    add("SC-23", "warn", "Lingkungan sekolah minim ruang terbuka: batasi objek pengamatan pada benda atau tanaman dalam kelas; jangan memaksakan skenario luar kelas yang sulit dilaksanakan (titik gagal 1E).");
  return out;
}

export const countIssues = (i: Issue[]) => ({ error: i.filter((x) => x.level === "error").length, warn: i.filter((x) => x.level === "warn").length });
