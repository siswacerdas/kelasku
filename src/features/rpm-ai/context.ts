/** Menyusun masukan AI dari data admin sendiri: TP, CP, profil, dan (opsional) tangga scaffolding sebagai dasar pertemuan. */
import type { ClassDoc } from "../kelas/types";
import type { Resolved } from "../profil/profile";
import type { ScaffoldDoc } from "../scaffold/model";
import { composeTp, type TpDoc } from "../tp/model";
import type { GenInput } from "./types";

export type DasarOption = { value: string; label: string };
const cut = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n)}...` : s);

/** Daftar dasar pertemuan: tiap tangga dan pertemuan inti dari tiap scaffold milik TP ini. */
export function dasarOptions(tp: TpDoc, scaffolds: ScaffoldDoc[], classes: ClassDoc[]): DasarOption[] {
  const out: DasarOption[] = [];
  for (const sc of scaffolds.filter((s) => s.tpId === tp.id)) {
    const kelas = classes.find((c) => c.id === sc.classId)?.name ?? "kelas?";
    sc.alternatif.forEach((a, ai) => a.tangga.forEach((t, ti) => out.push({ value: `${sc.id}|a${ai}|t${ti}`, label: `${kelas}, ${a.nama || `Alternatif ${ai + 1}`}, tangga ${ti + 1}: ${cut(t.kompetensi)}` })));
    out.push({ value: `${sc.id}|inti`, label: `${kelas}, pertemuan inti: ${cut(sc.inti.materiPuncak || sc.inti.kompetensi)}` });
  }
  return out;
}

export function buildGenInput(p: {
  tp: TpDoc; mapelNama: string; cpText: string; profile: Resolved[];
  meta: { topik: string; semester: 0 | 1 | 2; jp: number; menitPerJp: number; pertemuanKe: number; dariPertemuan: number };
  arahan: string; dasarValue: string; scaffolds: ScaffoldDoc[]; classes: ClassDoc[];
}): GenInput {
  const { tp } = p;
  let dasar: GenInput["dasar"];
  if (p.dasarValue) {
    const [id, kind, tk] = p.dasarValue.split("|");
    const sc = p.scaffolds.find((s) => s.id === id);
    if (sc) {
      const kelas = p.classes.find((c) => c.id === sc.classId)?.name ?? "";
      const shared = { kelas, analisis: sc.analisis, diagnostik: sc.diagnostik, inti: sc.inti, rangsangan: sc.rangsangan, objekPengamatan: sc.objekPengamatan };
      if (kind === "inti") dasar = { label: `Pertemuan inti, kelas ${kelas}`, data: { pertemuan: "inti", ...shared } };
      else {
        const ai = Number(kind.slice(1)), ti = Number(tk.slice(1));
        const alt = sc.alternatif[ai], tangga = alt?.tangga[ti];
        if (alt && tangga) dasar = { label: `${alt.nama}, tangga ${ti + 1}, kelas ${kelas}`, data: { pertemuan: `tangga ${ti + 1}`, alternatif: { nama: alt.nama, jenis: alt.jenis, rasional: alt.rasional }, tangga, ...shared } };
      }
    }
  }
  return {
    meta: { mapelId: tp.mapelId, mapelNama: p.mapelNama, grade: tp.grade, semester: p.meta.semester, topik: p.meta.topik, jp: p.meta.jp, menitPerJp: p.meta.menitPerJp, pertemuanKe: p.meta.pertemuanKe, dariPertemuan: p.meta.dariPertemuan },
    tp: { kko: tp.kko, objek: tp.objek, konten: tp.konten, bukti: tp.bukti, jp: tp.jp || p.meta.jp, tahapan: tp.tahapan.filter(Boolean), caraAsesmen: tp.caraAsesmen, tidakDipakai: tp.tidakDipakai },
    cp: p.cpText,
    profil: p.profile.map((r) => ({ key: r.key, answer: r.answer, source: r.source, decision: r.decision })),
    dasar, arahan: p.arahan,
  };
}
export const tpTahunanOf = (tp: TpDoc) => composeTp(tp).replace(/^Siswa harus bisa /, "");
