import type { GenInput } from "./types";

const fail = (m: string): never => { throw new Error(m); };
const str = (v: unknown, name: string, max: number, required = false): string => {
  if (v === undefined || v === null || v === "") { if (required) fail(`${name} wajib diisi`); return ""; }
  if (typeof v !== "string") fail(`${name} harus berupa teks`);
  const t = (v as string).trim();
  if (required && !t) fail(`${name} wajib diisi`);
  if (t.length > max) fail(`${name} terlalu panjang (maksimal ${max} karakter)`);
  return t;
};
const int = (v: unknown, name: string, min: number, max: number): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) fail(`${name} harus bilangan bulat ${min} sampai ${max}`);
  return n;
};

/** Memvalidasi masukan dari klien (tidak dipercaya, walau pemanggilnya admin). Melempar Error berpesan jelas. */
export function validateGenInput(raw: unknown): GenInput {
  if (JSON.stringify(raw ?? null).length > 60000) fail("Masukan terlalu besar");
  const o = (raw ?? {}) as Record<string, any>;
  const m = (o.meta ?? {}) as Record<string, unknown>;
  const t = (o.tp ?? {}) as Record<string, unknown>;
  const meta = {
    mapelId: str(m.mapelId, "Mata pelajaran", 40, true), mapelNama: str(m.mapelNama, "Nama mata pelajaran", 80, true),
    grade: int(m.grade, "Kelas", 1, 6), semester: int(m.semester ?? 0, "Semester", 0, 2) as 0 | 1 | 2,
    topik: str(m.topik, "Topik", 200, true), jp: int(m.jp, "JP", 1, 12), menitPerJp: int(m.menitPerJp, "Menit per JP", 10, 90),
    pertemuanKe: int(m.pertemuanKe, "Pertemuan ke-", 1, 40), dariPertemuan: int(m.dariPertemuan, "Dari pertemuan", 1, 40),
  };
  if (meta.dariPertemuan < meta.pertemuanKe) fail("Pertemuan ke- tidak boleh melebihi jumlah pertemuan");
  const tahapan = Array.isArray(t.tahapan) ? (t.tahapan as unknown[]).slice(0, 12).map((x) => str(x, "Tahapan TP", 600)) : [];
  const profil = (Array.isArray(o.profil) ? o.profil : []).slice(0, 10).map((p: Record<string, unknown>) => ({
    key: str(p.key, "Profil", 30, true), answer: (p.answer === "A" ? "A" : "B") as "A" | "B", source: (p.source === "guru" ? "guru" : "default") as "guru" | "default", decision: str(p.decision, "Keputusan profil", 400),
  }));
  let dasar: GenInput["dasar"];
  if (o.dasar) {
    if (JSON.stringify(o.dasar).length > 20000) fail("Dasar pertemuan terlalu besar");
    dasar = { label: str(o.dasar.label, "Label dasar", 200), data: (o.dasar.data ?? {}) as Record<string, unknown> };
  }
  return {
    meta,
    tp: { kko: str(t.kko, "KKO", 60, true), objek: str(t.objek, "Objek", 300), konten: str(t.konten, "Konten", 300), bukti: str(t.bukti, "Bukti", 300), jp: int(t.jp ?? meta.jp, "JP TP", 1, 200), tahapan, caraAsesmen: str(t.caraAsesmen, "Cara asesmen", 1000), tidakDipakai: str(t.tidakDipakai, "Yang tidak dipakai", 600) },
    cp: str(o.cp, "CP", 4000), profil, dasar, arahan: str(o.arahan, "Arahan", 2000),
  };
}
