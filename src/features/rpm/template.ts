/**
 * Pemetaan RPM <-> lembar kerja (template Excel). Murni dan teruji (RPM-3: template yang diunduh harus terbaca kembali).
 * Kolom isian tunggal dikenali dari KODE (kolom A lembar "Isi"), bukan dari label, sehingga label boleh diubah guru.
 */
import { SCALARS, SECTIONS, getPath, setPath } from "./fields";
import { DIMENSI, RUBRIK_LEVEL, TAHAP, TAHAP_INTI, TAHAP_LABEL, emptyKktp, emptyRow, emptyRpm, normalizeRpm, type RpmFields, type TahapKey } from "./model";

export type Sheets = Record<string, string[][]>;
export const SHEET = { isi: "Isi", dimensi: "Dimensi", kegiatan: "Kegiatan", adaptasi: "Adaptasi", rubrik: "Rubrik", observasi: "Observasi", kktp: "KKTP" } as const;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const t = (v: unknown) => (v == null ? "" : String(v));
const isContoh = (s: string) => /^\(contoh\)/i.test(s.trim());

export function rpmToSheets(r: RpmFields, mapelName: string, opts: { contoh?: boolean } = {}): Sheets {
  const isi: string[][] = [["Kode", "Bagian", "Isi", "Petunjuk"]];
  isi.push(["I1", "A.1 Identitas pembelajaran", mapelName, "Nama mata pelajaran, mis. Bahasa Indonesia"]);
  isi.push(["I2", "A.1 Identitas pembelajaran", r.grade ? String(r.grade) : "", "Kelas 1 sampai 6"]);
  isi.push(["I3", "A.1 Identitas pembelajaran", r.semester ? String(r.semester) : "", "1 atau 2"]);
  for (const s of SCALARS) isi.push([s.code, SECTIONS[s.section], t(getPath(r, s.path)), s.hint ?? s.label]);

  const dimensi: string[][] = [["No", "Dimensi", "Catatan singkat (semua diisi)", "Dominan (tulis ya untuk 2 sampai 3 dimensi)"]];
  r.b.dimensi.forEach((d, i) => dimensi.push([String(i + 1), d.nama, d.catatan, d.dominan ? "ya" : ""]));

  const kegiatan: string[][] = [["Tahap", "No", "Waktu (menit)", "Kegiatan pembelajaran", "Catatan (hanya bila relevan)"]];
  for (const tk of TAHAP) {
    const rows = r.c[tk].filter((x) => x.kegiatan.trim() || x.waktu);
    rows.forEach((x, i) => kegiatan.push([TAHAP_LABEL[tk], String(i + 1), x.waktu ? String(x.waktu) : "", x.kegiatan, x.catatan]));
  }
  if (opts.contoh) kegiatan.push(["Pendahuluan", "(contoh)", "1", "(contoh) Guru mengucap salam dan mengajak siswa berdoa bersama.", ""], ["Pendahuluan", "(contoh)", "2", "(contoh) Guru memeriksa kehadiran siswa satu per satu sambil menyapa singkat.", ""]);

  const adaptasi: string[][] = [["Tahap", "Cepat", "Lambat", "Pemalu"]];
  for (const tk of TAHAP_INTI) { const a = r.c.adaptasi[tk]; adaptasi.push([TAHAP_LABEL[tk], a.cepat, a.lambat, a.pemalu]); }

  const rubrik: string[][] = [["Jenis (Pengetahuan atau Kinerja)", "Aspek", ...RUBRIK_LEVEL]];
  r.d.rubrikPengetahuan.forEach((x) => rubrik.push(["Pengetahuan", x.aspek, x.l1, x.l2, x.l3, x.l4]));
  r.d.rubrikKinerja.forEach((x) => rubrik.push(["Kinerja", x.aspek, x.l1, x.l2, x.l3, x.l4]));

  const observasi: string[][] = [["Perilaku atau kompetensi teramati"]];
  r.d.observasi.perilaku.filter((x) => x.trim()).forEach((x) => observasi.push([x]));
  observasi.push(["Kolom PAK (ya atau tidak)", r.d.observasi.kolomPak ? "ya" : "tidak"]);

  const kktp: string[][] = [["Jenis KKTP (Pengetahuan/Kinerja)", "Level yang dituju", "Deskriptor capaian", "Bukti dari RPM ini"]];
  r.d.kktp.filter((k) => k.jenis || k.level || k.deskriptor || k.bukti).forEach((k) => kktp.push([k.jenis, k.level, k.deskriptor, k.bukti]));
  return { [SHEET.isi]: isi, [SHEET.dimensi]: dimensi, [SHEET.kegiatan]: kegiatan, [SHEET.adaptasi]: adaptasi, [SHEET.rubrik]: rubrik, [SHEET.observasi]: observasi, [SHEET.kktp]: kktp };
}

export const templateSheets = (): Sheets => rpmToSheets(emptyRpm(), "", { contoh: true });

const parseNum = (s: string) => { const m = s.match(/\d+/); return m ? Number(m[0]) : 0; };
const find = (sheets: Sheets, name: string) => sheets[Object.keys(sheets).find((k) => norm(k) === norm(name)) ?? ""];

/** Membaca lembar kerja menjadi RPM. `resolveMapel` memetakan nama mapel ke id. Catatan berisi hal yang diabaikan atau tidak dikenali. */
export function sheetsToRpm(sheets: Sheets, resolveMapel: (name: string) => string): { rpm: RpmFields; notes: string[] } {
  const notes: string[] = [];
  const r = emptyRpm();

  const isi = find(sheets, SHEET.isi);
  if (!isi) notes.push('Lembar "Isi" tidak ditemukan; isian tunggal tidak terbaca.');
  else {
    const byCode = new Map(SCALARS.map((s) => [s.code.toUpperCase(), s]));
    for (const row of isi.slice(1)) {
      const code = t(row[0]).trim().toUpperCase();
      if (!code) continue;
      const val = t(row[2]).trim();
      if (code === "I1") { if (val) { r.mapelId = resolveMapel(val); if (!r.mapelId) notes.push(`Mata pelajaran "${val}" tidak dikenali; pilih manual.`); } continue; }
      if (code === "I2") { r.grade = parseNum(val); continue; }
      if (code === "I3") { const n = parseNum(val); r.semester = n === 1 || n === 2 ? n : 0; continue; }
      const sc = byCode.get(code);
      if (!sc) { notes.push(`Kode "${code}" tidak dikenali dan diabaikan.`); continue; }
      if (sc.kind === "num") setPath(r, sc.path, parseNum(val));
      else if (sc.kind === "status") setPath(r, sc.path, /sumatif/i.test(val) && !/formatif/i.test(val) ? "sumatif" : /formatif/i.test(val) ? "formatif" : "");
      else setPath(r, sc.path, val);
    }
  }
  r.b.indikator = r.b.indikator.map((x) => x ?? "").filter((x, i, a) => x.trim() || i === 0 || a.slice(i).some((y) => y?.trim()));
  if (r.b.indikator.length === 0) r.b.indikator = [""];

  const dim = find(sheets, SHEET.dimensi);
  if (dim) for (const row of dim.slice(1)) {
    const i = DIMENSI.findIndex((n) => norm(n) === norm(t(row[1])));
    if (i >= 0) r.b.dimensi[i] = { nama: DIMENSI[i], catatan: t(row[2]).trim(), dominan: /^(ya|y|★|\*|x|1|true)$/i.test(t(row[3]).trim()) };
  } else notes.push('Lembar "Dimensi" tidak ditemukan.');

  const keg = find(sheets, SHEET.kegiatan);
  const rows: Record<TahapKey, ReturnType<typeof emptyRow>[]> = { pendahuluan: [], memahami: [], mengaplikasi: [], merefleksi: [], penutup: [] };
  if (keg) for (const row of keg.slice(1)) {
    const tk = TAHAP.find((k) => norm(TAHAP_LABEL[k]) === norm(t(row[0])));
    const kegiatan = t(row[3]).trim();
    if (!tk || isContoh(t(row[1])) || isContoh(kegiatan)) continue;
    if (!kegiatan && !t(row[2]).trim()) continue;
    rows[tk].push({ waktu: parseNum(t(row[2])), kegiatan, catatan: t(row[4]).trim() });
  } else notes.push('Lembar "Kegiatan" tidak ditemukan.');
  for (const tk of TAHAP) r.c[tk] = rows[tk].length ? rows[tk] : [emptyRow()];

  const ad = find(sheets, SHEET.adaptasi);
  if (ad) for (const row of ad.slice(1)) {
    const tk = TAHAP_INTI.find((k) => norm(TAHAP_LABEL[k]) === norm(t(row[0])));
    if (tk) r.c.adaptasi[tk] = { cepat: t(row[1]).trim(), lambat: t(row[2]).trim(), pemalu: t(row[3]).trim() };
  }

  const rub = find(sheets, SHEET.rubrik);
  r.d.rubrikPengetahuan = []; r.d.rubrikKinerja = [];
  if (rub) for (const row of rub.slice(1)) {
    const jenis = norm(t(row[0]));
    const x = { aspek: t(row[1]).trim(), l1: t(row[2]).trim(), l2: t(row[3]).trim(), l3: t(row[4]).trim(), l4: t(row[5]).trim() };
    if (!x.aspek && !x.l1) continue;
    if (jenis.startsWith("pengetahuan")) r.d.rubrikPengetahuan.push(x);
    else if (jenis.startsWith("kinerja")) r.d.rubrikKinerja.push(x);
    else notes.push(`Baris rubrik "${x.aspek}" diabaikan: jenis harus Pengetahuan atau Kinerja.`);
  }

  const obs = find(sheets, SHEET.observasi);
  const perilaku: string[] = [];
  if (obs) for (const row of obs.slice(1)) {
    if (norm(t(row[0])).startsWith("kolompak")) r.d.observasi.kolomPak = /^(ya|y|true|1)$/i.test(t(row[1]).trim());
    else if (t(row[0]).trim()) perilaku.push(t(row[0]).trim());
  }
  r.d.observasi.perilaku = perilaku.length ? perilaku : [""];

  const kk = find(sheets, SHEET.kktp);
  const list = (kk?.slice(1) ?? []).map((row) => ({ jenis: t(row[0]).trim(), level: t(row[1]).trim(), deskriptor: t(row[2]).trim(), bukti: t(row[3]).trim() })).filter((k) => k.jenis || k.level || k.deskriptor || k.bukti);
  r.d.kktp = list.length ? list : [emptyKktp()];
  return { rpm: normalizeRpm(r), notes };
}
