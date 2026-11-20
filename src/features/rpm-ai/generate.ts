/**
 * Pembuat RPM dengan AI (khusus admin). Murni: klien model disuntikkan, jadi seluruh alur teruji tanpa kunci API.
 * Alur: A+B -> (C dan D paralel) -> rakit -> setel waktu -> telaah -> satu putaran perbaikan -> telaah ulang.
 * Hasil TIDAK PERNAH langsung terbit: pemanggil menyimpannya sebagai draf pustaka untuk ditinjau admin (AI-1).
 */
import { emptyRpm, lintRpm, normalizeRpm, toStoredRpm, TAHAP, alokasiMenit, totalMenit, type Row, type RpmFields } from "../rpm/model";
import { emptyTp, type Issue, type TpDoc } from "../tp/model";
import { TOOLS } from "./schemas";
import { userAB, userC, userD, userRepair } from "./prompt";
import type { Deps, GenInput, GenResult, ModelRes, Usage } from "./types";

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

/** Menyetel selisih waktu kecil (aritmetika, bukan pedagogi) dengan menambah/mengurangi baris terpanjang di tahap inti. */
export function balanceTime(r: RpmFields): boolean {
  const alok = alokasiMenit(r);
  let diff = alok - totalMenit(r);
  if (alok <= 0 || diff === 0 || Math.abs(diff) > Math.max(5, Math.round(alok * 0.15))) return false;
  const rows = (["memahami", "mengaplikasi", "merefleksi"] as const).flatMap((t) => r.c[t]).filter((x) => x.kegiatan.trim());
  if (rows.length === 0) return false;
  while (diff !== 0) {
    const pool = [...rows].sort((a, b) => (diff > 0 ? a.waktu - b.waktu : b.waktu - a.waktu));
    const target = diff > 0 ? pool[0] : pool.find((x) => x.waktu > 1);
    if (!target) return false;
    target.waktu += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return true;
}

function addUsage(u: Usage, res: ModelRes) {
  u.calls += 1;
  u.input += res.usage?.input ?? 0; u.output += res.usage?.output ?? 0;
  u.cacheRead += res.usage?.cacheRead ?? 0; u.cacheWrite += res.usage?.cacheWrite ?? 0;
}

function rowsOf(x: unknown): Row[] {
  return (Array.isArray(x) ? x : []).map((y) => { const o = obj(y); return { waktu: Math.round(Number(o.waktu)) || 0, kegiatan: String(o.kegiatan ?? ""), catatan: String(o.catatan ?? "") }; });
}

/** Menerapkan bagian yang dikembalikan model ke RPM. Bagian yang tidak ada dibiarkan. */
export function applySections(base: RpmFields, s: { a?: unknown; b?: unknown; c?: unknown; d?: unknown }): RpmFields {
  const r = structuredClone(base);
  if (s.a) r.a = { ...r.a, ...(obj(s.a) as Partial<RpmFields["a"]>) };
  if (s.b) {
    const b = obj(s.b);
    r.b = { ...r.b, ...(b as Partial<RpmFields["b"]>) };
    if (Array.isArray(b.indikator)) r.b.indikator = (b.indikator as unknown[]).map(String).slice(0, 3);
  }
  if (s.c) {
    const c = obj(s.c);
    for (const t of TAHAP) if (c[t]) r.c[t] = rowsOf(c[t]);
    if (c.adaptasi) r.c.adaptasi = { ...r.c.adaptasi, ...(obj(c.adaptasi) as RpmFields["c"]["adaptasi"]) };
    if (typeof c.catatanPak === "string") r.c.catatanPak = c.catatanPak;
  }
  if (s.d) r.d = { ...r.d, ...(obj(s.d) as Partial<RpmFields["d"]>) } as RpmFields["d"];
  return normalizeRpm(r);
}

const tpFor = (i: GenInput): TpDoc => ({ ...emptyTp(), id: "ctx", status: "siap", mapelId: i.meta.mapelId, grade: i.meta.grade, kko: i.tp.kko, objek: i.tp.objek, konten: i.tp.konten, bukti: i.tp.bukti, caraAsesmen: i.tp.caraAsesmen, jp: i.tp.jp });

/** Temuan yang layak diperbaiki mesin: error dan saran. Audit mandiri guru dan petunjuk kop tidak ikut (memang menunggu manusia). */
export function repairable(issues: Issue[]): Issue[] {
  return issues.filter((x) => (x.level === "error" || x.level === "warn") && !/^Konfirmasi/.test(x.message));
}
export const lintForAi = (r: RpmFields, i: GenInput) => lintRpm(r, { tp: tpFor(i), school: { name: "x", principalName: "x" }, teacherName: "x" }).filter((x) => x.code !== "RPM-19" && !/^Konfirmasi/.test(x.message));

export async function generateRpmCore(input: GenInput, deps: Deps): Promise<GenResult> {
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 };
  const call = async (tool: (typeof TOOLS)[keyof typeof TOOLS], user: string, maxTokens: number) => {
    const res = await deps.callModel({ system: deps.system, user, tool: { name: tool.name, description: tool.description, schema: tool.schema as Record<string, unknown> }, maxTokens });
    addUsage(usage, res);
    return obj(res.input);
  };

  const base = emptyRpm();
  Object.assign(base, { mapelId: input.meta.mapelId, grade: input.meta.grade, semester: input.meta.semester, topik: input.meta.topik, jp: input.meta.jp, menitPerJp: input.meta.menitPerJp, pertemuanKe: input.meta.pertemuanKe, dariPertemuan: input.meta.dariPertemuan });

  const ab = await call(TOOLS.ab, userAB(input), 6000);
  const [c, d] = await Promise.all([call(TOOLS.c, userC(input, ab), 9000), call(TOOLS.d, userD(input, ab), 6000)]);
  let rpm = applySections(base, { a: ab.a, b: ab.b, c, d });
  rpm.b.cp = input.cp || rpm.b.cp; // CP disalin apa adanya dari sumber, bukan hasil model
  let adjusted = balanceTime(rpm);

  let issues = lintForAi(rpm, input);
  let repaired = false;
  const todo = repairable(issues);
  if (todo.length) {
    const patch = await call(TOOLS.patch, userRepair(input, rpm, todo), 9000);
    rpm = applySections(rpm, { a: patch.a, b: patch.b, c: patch.c, d: patch.d });
    rpm.b.cp = input.cp || rpm.b.cp;
    adjusted = balanceTime(rpm) || adjusted;
    issues = lintForAi(rpm, input);
    repaired = true;
  }
  rpm.konfirmasi = { kreativitas: false, fase: false, guruPengganti: false, inklusif: false }; // audit mandiri selalu oleh manusia
  return { rpm, issues, repaired, adjustedTime: adjusted, usage };
}

/** Dokumen pustaka dari hasil AI: SELALU berstatus draf; metadata asal-usul disertakan. */
export function buildLibraryPayload(res: GenResult, meta: { judul: string; uid: string; model: string; promptVersion: string }) {
  return {
    ...toStoredRpm({ ...res.rpm, tpId: "" }),
    status: "draf" as const,
    judul: meta.judul,
    createdBy: meta.uid,
    ai: {
      model: meta.model, promptVersion: meta.promptVersion, repaired: res.repaired, adjustedTime: res.adjustedTime,
      remaining: res.issues.filter((x) => x.level !== "info").map((x) => x.code), usage: res.usage,
    },
  };
}
