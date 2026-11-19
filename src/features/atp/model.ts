/**
 * Alur Tujuan Pembelajaran (ATP): menata relasi antar-TP dalam satu fase.
 * Sumber: Buku Saku CP-ATP-TP Bagian I.2, VII, VIII. Murni dan teruji (kontrak ATP-1, ATP-2).
 * ATP bukan gabungan TP: nilainya ada pada urutan, prasyarat, dan pengulangan lintas kelas.
 */
import { composeTp, emptyAtp, type AtpData, type Fase, type TpDoc } from "../tp/model";

export const FASE_GRADES: Record<Fase, [number, number]> = { A: [1, 2], B: [3, 4], C: [5, 6] };
export const atpOf = (t: TpDoc): AtpData => ({ ...emptyAtp(), ...t.atp, prasyarat: t.atp?.prasyarat ?? [] });

/** Urut: kelas, lalu urutan (0 = belum diurutkan, ditaruh paling akhir), lalu elemen, lalu id (stabil). */
export function sortTps(tps: TpDoc[]): TpDoc[] {
  const u = (t: TpDoc) => (atpOf(t).urutan > 0 ? atpOf(t).urutan : Number.MAX_SAFE_INTEGER);
  return [...tps].sort((a, b) => a.grade - b.grade || u(a) - u(b) || a.cpElemen.localeCompare(b.cpElemen, "id") || a.id.localeCompare(b.id));
}

/** Kode pendek per TP: "5.1", "5.2", ... mengikuti urutan di kelasnya. */
export function labelMap(tps: TpDoc[]): Map<string, string> {
  const m = new Map<string, string>();
  const count: Record<number, number> = {};
  for (const t of sortTps(tps)) {
    count[t.grade] = (count[t.grade] ?? 0) + 1;
    m.set(t.id, `${t.grade}.${count[t.grade]}`);
  }
  return m;
}

export type OrderUpdate = { id: string; urutan: number; grade?: number };

/** Menukar posisi satu TP dengan tetangganya di kolom yang sama; seluruh kolom dinomori ulang 1..n. */
export function moveWithin(column: TpDoc[], id: string, dir: -1 | 1): OrderUpdate[] {
  const ids = sortTps(column).map((t) => t.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return ids.map((x, k) => ({ id: x, urutan: k + 1 }));
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return ids.map((x, k) => ({ id: x, urutan: k + 1 }));
}

/** Memindahkan TP ke kelas lain: ditaruh di akhir kolom tujuan; kolom asal dinomori ulang. */
export function moveToGrade(all: TpDoc[], id: string, toGrade: number): OrderUpdate[] {
  const t = all.find((x) => x.id === id);
  if (!t || t.grade === toGrade) return [];
  const from = sortTps(all.filter((x) => x.grade === t.grade && x.id !== id)).map((x, k) => ({ id: x.id, urutan: k + 1 }));
  const target = all.filter((x) => x.grade === toGrade).length;
  return [...from, { id, grade: toGrade, urutan: target + 1 }];
}

export type AlurIssue = { code: string; level: "error" | "warn" | "info"; message: string };

export function lintAlur(tps: TpDoc[], ctx: { fase: Fase; elemen: string[] }): AlurIssue[] {
  const out: AlurIssue[] = [];
  const add = (code: string, level: AlurIssue["level"], message: string) => out.push({ code, level, message });
  if (tps.length === 0) return [{ code: "ATP-00", level: "info", message: "Belum ada TP untuk mata pelajaran dan fase ini. Susun TP lebih dulu; ATP menata TP yang sudah ada." }];

  const sorted = sortTps(tps);
  const label = labelMap(tps);
  const pos = new Map(sorted.map((t, i) => [t.id, i]));
  const byId = new Map(tps.map((t) => [t.id, t]));
  const L = (ids: string[]) => ids.map((i) => label.get(i) ?? "?").join(", ");

  const noReason = sorted.filter((t) => !atpOf(t).alasan.trim()).map((t) => t.id);
  if (noReason.length) add("ATP-01", "warn", `TP ${L(noReason)} belum punya alasan penempatan kelas. Dasarkan pada argumen konten (fondasi proses di kelas awal, penguatan kompleksitas di kelas akhir), bukan pembagian generik.`);

  const grades = new Set(tps.map((t) => t.grade));
  if (tps.length >= 2 && grades.size === 1)
    add("ATP-02", "warn", `Semua TP berada di Kelas ${[...grades][0]}. Fase ${ctx.fase} mencakup dua tingkat; periksa apakah penguatan kompleksitas seharusnya berada di kelas akhir.`);

  // Relasi prasyarat
  for (const t of sorted) {
    const pre = atpOf(t).prasyarat;
    const dangling = pre.filter((p) => !byId.has(p));
    if (dangling.length) add("ATP-03", "warn", `TP ${label.get(t.id)} merujuk prasyarat yang tidak ada lagi (mungkin sudah dihapus atau berbeda mapel/fase). Perbarui relasinya.`);
    for (const p of pre.filter((x) => byId.has(x))) {
      if (p === t.id) add("ATP-04", "error", `TP ${label.get(t.id)} tidak boleh menjadi prasyarat bagi dirinya sendiri.`);
      else if (pos.get(p)! > pos.get(t.id)!)
        add("ATP-05", "error", `TP ${label.get(p)} adalah prasyarat TP ${label.get(t.id)} tetapi urutannya lebih akhir. Pindahkan ${label.get(p)} ke depan.`);
    }
  }
  // Lingkaran prasyarat
  const state = new Map<string, 1 | 2>();
  let cyc = false;
  const dfs = (id: string) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { cyc = true; return; }
    state.set(id, 1);
    for (const p of atpOf(byId.get(id)!).prasyarat) if (byId.has(p) && p !== id) dfs(p);
    state.set(id, 2);
  };
  for (const t of tps) dfs(t.id);
  if (cyc) add("ATP-06", "error", "Relasi prasyarat membentuk lingkaran (A butuh B, B butuh A). Putuskan salah satu.");

  // Kontinuitas lintas kelas
  const lastGrade = FASE_GRADES[ctx.fase][1];
  const noNote = sorted.filter((t) => atpOf(t).kontinuitas === "diperdalam" && !atpOf(t).catatan.trim()).map((t) => t.id);
  if (noNote.length) add("ATP-07", "warn", `TP ${L(noNote)} ditandai perlu diperdalam lintas kelas tanpa catatan. Tulis apa yang diulang atau diperdalam.`);
  const lateDeep = sorted.filter((t) => atpOf(t).kontinuitas === "diperdalam" && t.grade === lastGrade).map((t) => t.id);
  if (lateDeep.length) add("ATP-08", "info", `TP ${L(lateDeep)} berada di kelas akhir fase tetapi ditandai perlu diperdalam; pendalamannya jatuh ke fase berikutnya. Pastikan itu disengaja.`);

  // Cakupan elemen CP
  const covered = new Set(tps.map((t) => t.cpElemen).filter(Boolean));
  const uncovered = ctx.elemen.filter((e) => !covered.has(e));
  if (uncovered.length) add("ATP-09", "warn", `Elemen CP belum punya TP: ${uncovered.join("; ")}.`);

  const drafts = tps.filter((t) => t.status !== "siap").length;
  if (drafts) add("ATP-10", "info", `${drafts} TP masih berstatus draf.`);
  return out;
}

export type RekapRow = { elemen: string; jumlah: number; jp: number; perKelas: Record<number, number> };

/** Rekap per elemen (Bagian VIII). JP bersifat indikatif. Baris "TP mandiri" untuk TP tanpa elemen CP. */
export function rekapJp(tps: TpDoc[], elemen: string[], grades: number[]): { rows: RekapRow[]; total: RekapRow } {
  const blank = (e: string): RekapRow => ({ elemen: e, jumlah: 0, jp: 0, perKelas: Object.fromEntries(grades.map((g) => [g, 0])) });
  const rows = new Map<string, RekapRow>(elemen.map((e) => [e, blank(e)]));
  const MANDIRI = "TP mandiri (tanpa elemen CP)";
  for (const t of tps) {
    const key = t.cpElemen && rows.has(t.cpElemen) ? t.cpElemen : MANDIRI;
    if (!rows.has(key)) rows.set(key, blank(key));
    const r = rows.get(key)!;
    r.jumlah += 1;
    r.jp += t.jp || 0;
    r.perKelas[t.grade] = (r.perKelas[t.grade] ?? 0) + (t.jp || 0);
  }
  const list = [...rows.values()].filter((r) => r.elemen !== MANDIRI || r.jumlah > 0);
  const total = blank("Total");
  for (const r of list) { total.jumlah += r.jumlah; total.jp += r.jp; for (const g of grades) total.perKelas[g] += r.perKelas[g] ?? 0; }
  return { rows: list, total };
}

export const shortTp = (t: TpDoc) => composeTp(t).replace(/^Siswa harus bisa /, "");
