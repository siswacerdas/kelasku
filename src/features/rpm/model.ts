/**
 * Model RPM (Rencana Pembelajaran Mendalam) dan ceklis mutu.
 * Sumber: Buku Saku RPM v3, Bagian III (struktur), IV-VII (pengaman mutu, PAK), VIII (ceklis), IX (ringkasan).
 * Murni dan teruji. Kontrak: RPM-1 dan RPM-2 di docs/ANTI-REGRESI.md.
 * Kode ceklis RPM-01..RPM-19 adalah penomoran kanonik atas 19 baris ceklis Bagian VIII.
 */
import { asesmenRowFor, composeTp, type Issue, type TpDoc } from "../tp/model";

export type Row = { waktu: number; kegiatan: string; catatan: string };
export type Adaptasi = { cepat: string; lambat: string; pemalu: string };
export type Dimensi = { nama: string; catatan: string; dominan: boolean };
export type RubrikRow = { aspek: string; l1: string; l2: string; l3: string; l4: string };
export type Kktp = { jenis: string; level: string; deskriptor: string; bukti: string };

export const DIMENSI = ["Keimanan & Ketakwaan", "Kewargaan", "Penalaran Kritis", "Kreativitas", "Kolaborasi", "Kemandirian", "Kesehatan", "Komunikasi"];
export const RUBRIK_LEVEL = ["Belum Terlihat", "Mulai Terlihat", "Berkembang Sesuai Harapan", "Sangat Berkembang"];
export const TAHAP = ["pendahuluan", "memahami", "mengaplikasi", "merefleksi", "penutup"] as const;
export type TahapKey = (typeof TAHAP)[number];
export const TAHAP_LABEL: Record<TahapKey, string> = { pendahuluan: "Pendahuluan", memahami: "Memahami", mengaplikasi: "Mengaplikasi", merefleksi: "Merefleksi", penutup: "Penutup" };
export const TAHAP_INTI = ["memahami", "mengaplikasi", "merefleksi"] as const;

export type RpmFields = {
  mapelId: string; grade: number; semester: 0 | 1 | 2; topik: string;
  jp: number; menitPerJp: number; pertemuanKe: number; dariPertemuan: number;
  tpId: string; // tautan opsional ke TP milik guru
  a: { pengetahuanAwal: string; minat: string; gayaBelajar: string; kebutuhan: string; implikasi: string; esensial: string; aplikatif: string; nilaiKarakter: string; elemenPak: string; relevansi: string; kesulitan: string };
  b: { cp: string; tpTahunan: string; tpHarian: string; indikator: string[]; elemenPak: string; konteks: string; praktik: string; kemitraan: string; lingkungan: string; dimensi: Dimensi[] };
  c: Record<TahapKey, Row[]> & { adaptasi: Record<(typeof TAHAP_INTI)[number], Adaptasi>; catatanPak: string };
  d: {
    diagnostik: { tugas: string; cara: string; tindakLanjut: string };
    formatif: { minimal: string; standar: string; lanjutan: string };
    sumatif: { status: "" | "formatif" | "sumatif"; peran: string; instrumen: string };
    rubrikPengetahuan: RubrikRow[]; rubrikKinerja: RubrikRow[];
    observasi: { perilaku: string[]; kolomPak: boolean };
    kktp: Kktp[];
  };
  konfirmasi: { kreativitas: boolean; fase: boolean; guruPengganti: boolean; inklusif: boolean };
};
export type RpmDoc = RpmFields & { id: string; status: "draf" | "siap"; sumber?: { libraryId: string } };

export const emptyRow = (): Row => ({ waktu: 0, kegiatan: "", catatan: "" });
const emptyAdaptasi = (): Adaptasi => ({ cepat: "", lambat: "", pemalu: "" });
export const emptyRubrik = (): RubrikRow => ({ aspek: "", l1: "", l2: "", l3: "", l4: "" });
export const emptyKktp = (): Kktp => ({ jenis: "", level: "", deskriptor: "", bukti: "" });

export function emptyRpm(): RpmFields {
  return {
    mapelId: "", grade: 0, semester: 0, topik: "", jp: 2, menitPerJp: 35, pertemuanKe: 1, dariPertemuan: 1, tpId: "",
    a: { pengetahuanAwal: "", minat: "", gayaBelajar: "", kebutuhan: "", implikasi: "", esensial: "", aplikatif: "", nilaiKarakter: "", elemenPak: "", relevansi: "", kesulitan: "" },
    b: { cp: "", tpTahunan: "", tpHarian: "", indikator: [""], elemenPak: "", konteks: "", praktik: "", kemitraan: "", lingkungan: "", dimensi: DIMENSI.map((nama) => ({ nama, catatan: "", dominan: false })) },
    c: {
      pendahuluan: [emptyRow()], memahami: [emptyRow()], mengaplikasi: [emptyRow()], merefleksi: [emptyRow()], penutup: [emptyRow()],
      adaptasi: { memahami: emptyAdaptasi(), mengaplikasi: emptyAdaptasi(), merefleksi: emptyAdaptasi() }, catatanPak: "",
    },
    d: {
      diagnostik: { tugas: "", cara: "", tindakLanjut: "" }, formatif: { minimal: "", standar: "", lanjutan: "" },
      sumatif: { status: "", peran: "", instrumen: "" }, rubrikPengetahuan: [], rubrikKinerja: [],
      observasi: { perilaku: [""], kolomPak: false }, kktp: [emptyKktp()],
    },
    konfirmasi: { kreativitas: false, fase: false, guruPengganti: false, inklusif: false },
  };
}

/** Melengkapi dokumen lama/sebagian dengan nilai awal (DATA-1). Array dipertahankan; objek digabung. */
export function normalizeRpm(raw: Partial<RpmFields> | undefined): RpmFields {
  const e = emptyRpm();
  const r = (raw ?? {}) as Partial<RpmFields>;
  const rows = (x: Row[] | undefined, fallback: Row[]) => (x ?? fallback).map((y) => ({ ...emptyRow(), ...y }));
  const dim = DIMENSI.map((nama, i) => ({ ...e.b.dimensi[i], ...(r.b?.dimensi?.find((d) => d.nama === nama) ?? r.b?.dimensi?.[i]), nama }));
  return {
    ...e, ...r,
    a: { ...e.a, ...r.a },
    b: { ...e.b, ...r.b, indikator: r.b?.indikator?.length ? r.b.indikator : [""], dimensi: dim },
    c: {
      pendahuluan: rows(r.c?.pendahuluan, e.c.pendahuluan), memahami: rows(r.c?.memahami, e.c.memahami), mengaplikasi: rows(r.c?.mengaplikasi, e.c.mengaplikasi),
      merefleksi: rows(r.c?.merefleksi, e.c.merefleksi), penutup: rows(r.c?.penutup, e.c.penutup),
      adaptasi: {
        memahami: { ...emptyAdaptasi(), ...r.c?.adaptasi?.memahami }, mengaplikasi: { ...emptyAdaptasi(), ...r.c?.adaptasi?.mengaplikasi }, merefleksi: { ...emptyAdaptasi(), ...r.c?.adaptasi?.merefleksi },
      },
      catatanPak: r.c?.catatanPak ?? "",
    },
    d: {
      diagnostik: { ...e.d.diagnostik, ...r.d?.diagnostik }, formatif: { ...e.d.formatif, ...r.d?.formatif }, sumatif: { ...e.d.sumatif, ...r.d?.sumatif },
      rubrikPengetahuan: (r.d?.rubrikPengetahuan ?? []).map((x) => ({ ...emptyRubrik(), ...x })),
      rubrikKinerja: (r.d?.rubrikKinerja ?? []).map((x) => ({ ...emptyRubrik(), ...x })),
      observasi: { perilaku: r.d?.observasi?.perilaku?.length ? r.d.observasi.perilaku : [""], kolomPak: r.d?.observasi?.kolomPak ?? false },
      kktp: (r.d?.kktp ?? e.d.kktp).map((x) => ({ ...emptyKktp(), ...x })),
    },
    konfirmasi: { ...e.konfirmasi, ...r.konfirmasi },
  };
}

/** Hanya bidang RPM yang ditulis; id, status, sumber ditangani terpisah (DATA-1). */
export function toStoredRpm(r: RpmFields): RpmFields {
  const { mapelId, grade, semester, topik, jp, menitPerJp, pertemuanKe, dariPertemuan, tpId, a, b, c, d, konfirmasi } = r;
  return { mapelId, grade, semester, topik, jp, menitPerJp, pertemuanKe, dariPertemuan, tpId, a, b, c, d, konfirmasi };
}

export const alokasiMenit = (r: Pick<RpmFields, "jp" | "menitPerJp">) => (r.jp || 0) * (r.menitPerJp || 0);
export const totalMenit = (r: RpmFields) => TAHAP.reduce((n, t) => n + r.c[t].reduce((m, x) => m + (Number(x.waktu) || 0), 0), 0);

/** Awalan untuk RPM baru dari sebuah TP (tpTahunan, CP, mapel, kelas, JP). Tidak mengisi yang tidak diketahui. */
export function prefillFromTp(tp: TpDoc, cpText: string, base: RpmFields = emptyRpm()): RpmFields {
  const r = structuredClone(base);
  r.tpId = tp.id; r.mapelId = tp.mapelId; r.grade = tp.grade; r.semester = tp.semester;
  r.b.tpTahunan = composeTp(tp).replace(/^Siswa harus bisa /, "");
  if (cpText) r.b.cp = cpText;
  r.d.sumatif.instrumen = tp.caraAsesmen;
  return r;
}

// ---------- Heuristik teks ----------
const stripParen = (s: string) => s.replace(/\([^)]*\)/g, "");
/** Perkiraan satu baris memuat lebih dari satu tindakan (Uji Granularitas). Bersifat saran, bukan vonis. */
export function maybeMultiAction(text: string): boolean {
  const t = stripParen(text);
  if (/\b(kemudian|lalu|setelah itu|selanjutnya|sesudah itu)\b/i.test(t)) return true;
  if (t.split(/[.!?]+\s+/).filter((s) => s.trim().length > 3).length >= 4) return true;
  return t.split(",").length >= 3 && /\bdan\b/i.test(t);
}
const TAG = /berkesadaran|bermakna|menggembirakan/i;
const RITUAL_BUKA = /salam|doa|berdoa/i;
const PRESENSI = /hadir|presensi|absen/i;
const TUJUAN = /tujuan pembelajaran|tujuan hari ini|tujuan belajar/i;
const APERSEPSI = /pertanyaan pemantik|apersepsi|motivasi|mengaitkan/i;
const RANGKUM = /rangkum|simpul|poin utama/i;
const TINDAK = /tugas|tindak lanjut|pekerjaan rumah/i;
const TUTUP = /salam|doa|berdoa|menutup/i;
const L = (s: string) => s.trim().length > 0;

export type Ctx = { tp?: TpDoc; school?: { name?: string; principalName?: string }; teacherName?: string };

export function lintRpm(r: RpmFields, ctx: Ctx = {}): Issue[] {
  const out: Issue[] = [];
  const add = (code: string, level: Issue["level"], message: string) => out.push({ code, level, message });

  // RPM-01 struktur lengkap
  const miss: string[] = [];
  const need = (ok: boolean, name: string) => { if (!ok) miss.push(name); };
  need(!!r.mapelId && r.grade > 0 && L(r.topik), "A.1 identitas (mapel, kelas, topik)");
  need(r.jp >= 1 && r.menitPerJp >= 1, "A.1 alokasi waktu");
  need(r.pertemuanKe >= 1 && r.dariPertemuan >= r.pertemuanKe, "A.1 pertemuan ke- dari berapa");
  need([r.a.pengetahuanAwal, r.a.minat, r.a.gayaBelajar, r.a.kebutuhan, r.a.implikasi].every(L), "A.2 analisis peserta didik");
  need([r.a.esensial, r.a.aplikatif, r.a.nilaiKarakter, r.a.relevansi, r.a.kesulitan].every(L), "A.3 analisis materi");
  need(L(r.b.cp), "B.1 CP"); need(L(r.b.konteks), "B.3 topik/konteks nyata"); need(L(r.b.praktik), "B.5 praktik pedagogis"); need(L(r.b.lingkungan), "B.7 lingkungan dan sarana");
  need(L(r.b.kemitraan), "B.6 kemitraan (tulis 'tidak relevan' bila memang tidak)");
  need([r.d.diagnostik.tugas, r.d.diagnostik.cara, r.d.diagnostik.tindakLanjut].every(L), "D.1 asesmen diagnostik");
  need(TAHAP.every((t) => r.c[t].some((x) => L(x.kegiatan))), "C tabel setiap tahap");
  if (miss.length) add("RPM-01", "error", `Struktur A-D belum lengkap. Belum terisi: ${miss.join("; ")}. Tidak ada bagian yang boleh dihilangkan.`);

  // RPM-02 TP dipisah + indikator
  const ind = r.b.indikator.filter(L);
  if (!L(r.b.tpTahunan) || !L(r.b.tpHarian)) add("RPM-02", "error", "TP Tahunan dan TP Harian harus ditulis terpisah (B.2).");
  if (ind.length === 0) add("RPM-02", "error", "Tulis 1 sampai 3 indikator terukur yang tertaut ke kriteria formatif (B.2).");
  else if (ind.length > 3) add("RPM-02", "warn", "Indikator terukur sebaiknya 1 sampai 3 saja, agar tertaut jelas ke kriteria formatif.");

  // RPM-03 dimensi
  const dim = r.b.dimensi;
  const dominan = dim.filter((d) => d.dominan).length;
  if (dim.length !== 8 || dim.some((d) => !L(d.catatan))) add("RPM-03", "error", "Tulis ke-8 Dimensi Profil Lulusan, masing-masing satu baris catatan singkat (B.4).");
  if (dominan < 2 || dominan > 3) add("RPM-03", "error", `Tandai ★ pada 2 sampai 3 dimensi paling dominan (saat ini ${dominan}).`);

  // RPM-06 adaptasi
  const lackAd = TAHAP_INTI.filter((t) => !(L(r.c.adaptasi[t].cepat) && L(r.c.adaptasi[t].lambat) && L(r.c.adaptasi[t].pemalu)));
  if (lackAd.length) add("RPM-06", "error", `Adaptasi Cepat, Lambat, dan Pemalu wajib di tiap tahap inti. Belum lengkap: ${lackAd.map((t) => TAHAP_LABEL[t]).join(", ")}.`);

  // RPM-07 tabel + tanpa "Langkah N"
  const langkah = TAHAP.filter((t) => r.c[t].some((x) => /^\s*langkah\s*\d+/i.test(x.kegiatan)));
  if (langkah.length) add("RPM-07", "warn", `Kolom kegiatan tidak memakai embel-embel "Langkah N" (${langkah.map((t) => TAHAP_LABEL[t]).join(", ")}). Tulis langsung tindakannya, mengalir seperti skenario.`);

  // RPM-08 waktu
  const tanpaWaktu = TAHAP.filter((t) => r.c[t].some((x) => L(x.kegiatan) && !(Number(x.waktu) >= 1)));
  if (tanpaWaktu.length) add("RPM-08", "error", `Kolom waktu wajib terisi di setiap baris (belum: ${tanpaWaktu.map((t) => TAHAP_LABEL[t]).join(", ")}).`);
  const alok = alokasiMenit(r), tot = totalMenit(r);
  if (alok > 0 && tot !== alok) add("RPM-08", "error", `Total waktu semua baris ${tot} menit, alokasi ${alok} menit (${r.jp} JP x ${r.menitPerJp}). ${tot < alok ? `Kurang ${alok - tot}` : `Lebih ${tot - alok}`} menit.`);

  // RPM-09 granularitas
  const multi: string[] = [];
  for (const t of TAHAP) r.c[t].forEach((x, i) => { if (maybeMultiAction(x.kegiatan)) multi.push(`${TAHAP_LABEL[t]} baris ${i + 1}`); });
  if (multi.length) add("RPM-09", "warn", `Baris berikut tampak memuat lebih dari satu tindakan; pertimbangkan dipecah agar guru pengganti tidak perlu mengarang: ${multi.join(", ")}.`);

  // RPM-10 ritual
  const pd = r.c.pendahuluan, pt = r.c.penutup;
  if (!pd.some((x) => RITUAL_BUKA.test(x.kegiatan))) add("RPM-10", "error", "Pendahuluan wajib diawali ritual pembuka (salam, doa) sebagai baris tersendiri.");
  if (!pd.some((x) => PRESENSI.test(x.kegiatan))) add("RPM-10", "warn", "Pendahuluan belum memuat baris presensi.");
  if (!pd.some((x) => APERSEPSI.test(x.kegiatan))) add("RPM-10", "warn", "Pendahuluan belum memuat baris apersepsi atau motivasi.");
  if (!pd.some((x) => TUJUAN.test(x.kegiatan))) add("RPM-10", "warn", "Pendahuluan belum memuat baris penyampaian tujuan pembelajaran.");
  if (pd.some((x) => RITUAL_BUKA.test(x.kegiatan) && (TUJUAN.test(x.kegiatan) || APERSEPSI.test(x.kegiatan)))) add("RPM-10", "warn", "Ritual pembuka tergabung dengan apersepsi atau tujuan dalam satu baris; pisahkan.");
  if (!pt.some((x) => TUTUP.test(x.kegiatan))) add("RPM-10", "error", "Penutup wajib memuat ritual penutup (doa, salam) sebagai baris tersendiri.");
  if (!pt.some((x) => RANGKUM.test(x.kegiatan))) add("RPM-10", "warn", "Penutup belum memuat baris rangkuman.");
  if (!pt.some((x) => TINDAK.test(x.kegiatan))) add("RPM-10", "warn", "Penutup belum memuat baris tindak lanjut (atau pernyataan eksplisit tidak ada tugas).");

  // RPM-11 catatan
  const all = TAHAP.flatMap((t) => r.c[t]).filter((x) => L(x.kegiatan));
  const filled = all.filter((x) => L(x.catatan));
  const taggedNoReason = filled.filter((x) => !TAG.test(x.catatan) || x.catatan.replace(/[^\p{L}\s]/gu, "").trim().length < 25).length;
  if (taggedNoReason) add("RPM-11", "warn", `${taggedNoReason} catatan belum menyebut prinsip (Berkesadaran, Bermakna, Menggembirakan) disertai alasan singkat.`);
  if (all.length >= 6 && filled.length / all.length >= 0.9) add("RPM-11", "warn", "Catatan terisi hampir di semua baris. Isi hanya pada baris yang benar-benar mencerminkan prinsipnya; kolom kosong itu wajar.");

  // RPM-12 formatif
  const f = r.d.formatif;
  if (!(L(f.minimal) && L(f.standar) && L(f.lanjutan))) add("RPM-12", "error", "Kriteria formatif wajib tiga tingkat: Minimal, Standar, Lanjutan, tertaut ke indikator terukur (D.2).");

  // RPM-13 sumatif
  const s = r.d.sumatif;
  if (!s.status) add("RPM-13", "error", "Tentukan status asesmen akhir pertemuan ini: Formatif-saja atau Sumatif (D.3).");
  else if (s.status === "formatif" && !L(s.peran)) add("RPM-13", "error", "Formatif-saja: sebutkan pertemuan atau RPM mana yang membawa asesmen sumatif.");
  else if (s.status === "sumatif") {
    if (!L(s.instrumen)) add("RPM-13", "error", "Sumatif: tulis instrumen sumatif yang sesuai KKO TP.");
    else { const row = ctx.tp ? asesmenRowFor(ctx.tp.kko) : undefined; if (row?.bad(s.instrumen)) add("RPM-13", "warn", `Untuk "${ctx.tp?.kko}", bentuk asesmen yang lazim sesuai: ${row.sesuai}. Yang sering salah dipilih: ${row.salah}.`); }
  }

  // RPM-14 rubrik
  const rubOk = (x: RubrikRow[]) => x.length > 0 && x.every((y) => L(y.aspek) && L(y.l1) && L(y.l2) && L(y.l3) && L(y.l4));
  const rb = r.d.rubrikPengetahuan.length ? rubOk(r.d.rubrikPengetahuan) : false, rk = r.d.rubrikKinerja.length ? rubOk(r.d.rubrikKinerja) : false;
  if (!rb && !rk) add("RPM-14", "error", "Sediakan Rubrik Pengetahuan dan/atau Rubrik Kinerja, masing-masing dengan 4 level yang terisi (D.4).");
  else if ((r.d.rubrikPengetahuan.length && !rb) || (r.d.rubrikKinerja.length && !rk)) add("RPM-14", "error", "Ada rubrik yang levelnya belum terisi lengkap (4 level per aspek).");
  if (ctx.tp && /menyajikan|mendemonstrasikan|merancang|mengkreasi/i.test(ctx.tp.kko) && !rk) add("RPM-14", "warn", "TP ini bersifat performa atau produk; pertimbangkan Rubrik Kinerja.");

  // RPM-15 observasi, RPM-16 KKTP
  if (!r.d.observasi.perilaku.some(L)) add("RPM-15", "error", "Ceklis observasi guru butuh minimal satu perilaku atau kompetensi teramati (D.5).");
  if (!r.d.kktp.some((k) => L(k.jenis) || L(k.deskriptor)) || r.d.kktp.some((k) => !(L(k.jenis) && L(k.level) && L(k.deskriptor) && L(k.bukti)))) add("RPM-16", "error", "Tabel KKTP dan Dimensi Profil Lulusan harus terisi lengkap pada keempat kolom (D.6).");

  // RPM-17/18 PAK
  const pak = L(r.a.elemenPak) || L(r.b.elemenPak);
  if (pak) {
    if (!L(r.a.elemenPak) || !L(r.b.elemenPak)) add("RPM-17", "error", "Elemen PAK harus konsisten: isi di A.3 dan B.2 sekaligus.");
    if (!L(r.c.catatanPak)) add("RPM-17", "error", "Elemen PAK terisi: tambahkan catatan pemetaan Temukan-Bayangkan-Lakukan-Bagikan setelah tabel Merefleksi.");
    if (!r.d.observasi.kolomPak) add("RPM-17", "error", "Elemen PAK terisi: aktifkan kolom PAK pada ceklis observasi (satu instrumen untuk TP dan PAK).");
  } else if (L(r.c.catatanPak) || r.d.observasi.kolomPak) add("RPM-18", "warn", "Elemen PAK kosong tetapi ada catatan atau kolom PAK. PAK tidak dipaksakan; kosongkan bila tidak relevan.");

  // RPM-19 kop dan pengesahan
  if (!ctx.school?.name || !ctx.school?.principalName || !ctx.teacherName) add("RPM-19", "info", "Data kop dan blok pengesahan (sekolah, kepala sekolah, guru) belum lengkap di Pengaturan; dokumen resmi akan memakai tempat isian.");

  // Audit mandiri
  const k = r.konfirmasi;
  if (!k.kreativitas) add("RPM-04", "warn", "Konfirmasi: aktivitas berbeda dari 2 pertemuan sebelumnya, melibatkan lebih dari satu moda belajar, dan benar-benar perlu untuk TP.");
  if (!k.fase) add("RPM-05", "warn", "Konfirmasi: bahasa, tuntutan kognitif, dan durasi aktivitas sesuai fase atau kelas.");
  if (!k.guruPengganti) add("RPM-07", "warn", "Konfirmasi uji kecukupan: guru pengganti yang belum pernah mengajar materi ini dapat menjalankan baris-baris ini tanpa mengarang.");
  if (!k.inklusif) add("RPM-06", "warn", "Konfirmasi inklusif: ada jalur alternatif untuk kecepatan belajar berbeda, siswa pemalu tidak dipaksa tampil lebih dulu, dan tidak mengasumsikan latar belakang tertentu sebagai baku.");
  return out;
}

export const CEKLIS: { code: string; kriteria: string; guru?: keyof RpmFields["konfirmasi"] }[] = [
  { code: "RPM-01", kriteria: "Struktur A-D lengkap tanpa bagian yang dihilangkan" },
  { code: "RPM-02", kriteria: "TP Tahunan, TP Harian, dan Indikator Terukur ditulis terpisah" },
  { code: "RPM-03", kriteria: "Ke-8 Dimensi Profil Lulusan ditulis, 2-3 dominan ditandai ★" },
  { code: "RPM-04", kriteria: "Aktivitas berbeda dari 2 pertemuan sebelumnya untuk mapel yang sama", guru: "kreativitas" },
  { code: "RPM-05", kriteria: "Bahasa dan tuntutan kognitif sesuai fase atau kelas", guru: "fase" },
  { code: "RPM-06", kriteria: "Adaptasi Cepat/Lambat/Pemalu tersedia di setiap tahap inti dan inklusif", guru: "inklusif" },
  { code: "RPM-07", kriteria: "Setiap tahap berupa tabel dan lolos uji guru pengganti", guru: "guruPengganti" },
  { code: "RPM-08", kriteria: "Kolom waktu terisi di setiap baris dan totalnya sesuai alokasi waktu" },
  { code: "RPM-09", kriteria: "Tidak ada baris yang memuat lebih dari satu tindakan (uji granularitas)" },
  { code: "RPM-10", kriteria: "Ritual pembuka dan penutup sebagai baris terpisah" },
  { code: "RPM-11", kriteria: "Kolom catatan hanya terisi di baris yang relevan, dengan alasan singkat" },
  { code: "RPM-12", kriteria: "Kriteria formatif tiga tingkat: Minimal, Standar, Lanjutan" },
  { code: "RPM-13", kriteria: "Status asesmen akhir dan peran dalam sumatif jelas" },
  { code: "RPM-14", kriteria: "Rubrik Pengetahuan dan/atau Kinerja tersedia sesuai jenis TP" },
  { code: "RPM-15", kriteria: "Tabel ceklis observasi guru tersedia" },
  { code: "RPM-16", kriteria: "Tabel keterkaitan KKTP dan Dimensi Profil Lulusan terisi" },
  { code: "RPM-17", kriteria: "Jika Elemen PAK diisi: A.3, B.2, lensa C, dan kolom PAK D.5 konsisten" },
  { code: "RPM-18", kriteria: "Jika Elemen PAK tidak relevan: dikosongkan, tidak dipaksakan" },
  { code: "RPM-19", kriteria: "Format resmi: kop, tabel identitas, dan blok pengesahan lengkap" },
];

export type CeklisStatus = "lolos" | "perlu" | "belum";
/** Status tiap butir ceklis: perlu = ada temuan error/saran, belum = butir audit mandiri guru belum dicentang. */
export function ceklisStatus(issues: Issue[], r: RpmFields): { code: string; kriteria: string; status: CeklisStatus }[] {
  return CEKLIS.map((c) => {
    const mine = issues.filter((i) => i.code === c.code && i.level !== "info");
    const guruMissing = !!c.guru && !r.konfirmasi[c.guru];
    const structural = mine.filter((i) => !(c.guru && /^Konfirmasi/.test(i.message)));
    return { code: c.code, kriteria: c.kriteria, status: structural.length ? "perlu" : guruMissing ? "belum" : "lolos" };
  });
}
export const countIssues = (i: Issue[]) => ({ error: i.filter((x) => x.level === "error").length, warn: i.filter((x) => x.level === "warn").length });
