import { describe, expect, it } from "vitest";
import { lengkap } from "../rpm/fixture";
import { totalMenit } from "../rpm/model";
import { emptyTp, type TpDoc } from "../tp/model";
import { newScaffold, scaffoldId, type ScaffoldDoc } from "../scaffold/model";
import { mergedProfile } from "../scaffold/model";
import type { ClassDoc } from "../kelas/types";
import { buildGenInput, dasarOptions } from "./context";
import { balanceTime, buildLibraryPayload, generateRpmCore, repairable } from "./generate";
import type { Deps, GenInput, ModelReq } from "./types";
import { validateGenInput } from "./validate";

const gold = lengkap();
const input: GenInput = {
  meta: { mapelId: "ppkn", mapelNama: "PPKn", grade: 5, semester: 1, topik: "Norma dan aturan", jp: 1, menitPerJp: 49, pertemuanKe: 1, dariPertemuan: 2 },
  tp: { kko: "Menjelaskan", objek: "alasan aturan", konten: "norma", bukti: "tulisan singkat", jp: 2, tahapan: ["a", "b", "c", "d"], caraAsesmen: "esai pendek dengan rubrik", tidakDipakai: "" },
  cp: "CP resmi dari bank CP", profil: [], arahan: "", dasar: undefined,
};
const SYSTEM = [{ text: "sistem", cache: true }];

/** Klien model palsu: mengembalikan bagian dari RPM acuan, dengan pengait untuk merusak/memperbaiki. */
function fake(opts: { mutateC?: (c: typeof gold.c) => void; patch?: (req: ModelReq) => unknown; ab?: (ab: { a: unknown; b: Record<string, unknown> }) => void } = {}) {
  const calls: ModelReq[] = [];
  const deps: Deps = {
    system: SYSTEM,
    callModel: async (req) => {
      calls.push(req);
      const u = { input: 100, output: 50 };
      if (req.tool.name === "susun_bagian_ab") { const ab = structuredClone({ a: gold.a, b: gold.b }); opts.ab?.(ab as never); return { input: ab, usage: u }; }
      if (req.tool.name === "susun_bagian_c") { const c = structuredClone(gold.c); opts.mutateC?.(c); return { input: c, usage: u }; }
      if (req.tool.name === "susun_bagian_d") return { input: structuredClone(gold.d), usage: u };
      return { input: opts.patch ? opts.patch(req) : {}, usage: u };
    },
  };
  return { deps, calls };
}
const real = (r: Awaited<ReturnType<typeof generateRpmCore>>) => r.issues.filter((i) => i.level !== "info");

describe("generateRpmCore (AI-1)", () => {
  it("jalur normal: 3 panggilan, tanpa perbaikan, lolos ceklis, audit mandiri tetap kosong", async () => {
    const { deps, calls } = fake();
    const r = await generateRpmCore(input, deps);
    expect(calls.map((c) => c.tool.name).sort()).toEqual(["susun_bagian_ab", "susun_bagian_c", "susun_bagian_d"]);
    expect(r.repaired).toBe(false);
    expect(real(r)).toEqual([]);
    expect(r.rpm.konfirmasi).toEqual({ kreativitas: false, fase: false, guruPengganti: false, inklusif: false });
    expect(r.usage).toMatchObject({ calls: 3, input: 300, output: 150 });
    expect(calls.every((c) => c.system === SYSTEM)).toBe(true);
  });
  it("C dan D dijalankan setelah A+B (urutan), dan A+B dikirim ke keduanya", async () => {
    const { deps, calls } = fake();
    await generateRpmCore(input, deps);
    expect(calls[0].tool.name).toBe("susun_bagian_ab");
    expect(calls[1].user).toContain("TOTAL WAKTU SEMUA BARIS = 49");
    expect(calls[2].user).toContain("Bagian A dan B yang sudah disusun");
  });
  it("selisih waktu kecil disetel otomatis tanpa memanggil perbaikan", async () => {
    const { deps, calls } = fake({ mutateC: (c) => { c.penutup[0].waktu += 3; } });
    const r = await generateRpmCore(input, deps);
    expect(r.adjustedTime).toBe(true);
    expect(totalMenit(r.rpm)).toBe(49);
    expect(r.repaired).toBe(false);
    expect(calls).toHaveLength(3);
  });
  it("pelanggaran struktural memicu tepat satu putaran perbaikan, lalu lolos", async () => {
    const { deps, calls } = fake({
      mutateC: (c) => { c.penutup = c.penutup.filter((x) => !/doa|salam/.test(x.kegiatan)); },
      patch: () => ({ c: { ...gold.c } }),
    });
    const r = await generateRpmCore(input, deps);
    expect(calls.filter((c) => c.tool.name === "perbaiki_rpm")).toHaveLength(1);
    expect(calls.at(-1)!.user).toContain("RPM-10");
    expect(r.repaired).toBe(true);
    expect(real(r)).toEqual([]);
  });
  it("bila perbaikan gagal, sisa temuan dilaporkan (tidak melempar, tidak diam-diam)", async () => {
    const { deps } = fake({ mutateC: (c) => { c.penutup = c.penutup.filter((x) => !/doa|salam/.test(x.kegiatan)); }, patch: () => ({}) });
    const r = await generateRpmCore(input, deps);
    expect(r.repaired).toBe(true);
    expect(real(r).some((i) => i.code === "RPM-10")).toBe(true);
    const payload = buildLibraryPayload(r, { judul: "J", uid: "u1", model: "m", promptVersion: "p" });
    expect(payload.ai.remaining).toContain("RPM-10");
  });
  it("CP selalu disalin dari sumber, bukan dari keluaran model", async () => {
    const { deps } = fake({ ab: (ab) => { ab.b.cp = "CP karangan model"; } });
    const r = await generateRpmCore(input, deps);
    expect(r.rpm.b.cp).toBe("CP resmi dari bank CP");
  });
  it("kegagalan klien model disebarkan (tidak ada hasil setengah jadi)", async () => {
    const deps: Deps = { system: SYSTEM, callModel: async () => { throw new Error("jaringan"); } };
    await expect(generateRpmCore(input, deps)).rejects.toThrow("jaringan");
  });
  it("hasil AI selalu berstatus draf dan tidak membawa tautan TP", async () => {
    const r = await generateRpmCore(input, fake().deps);
    const p = buildLibraryPayload(r, { judul: "J", uid: "u1", model: "m", promptVersion: "v" });
    expect(p.status).toBe("draf");
    expect(p.tpId).toBe("");
    expect(p.createdBy).toBe("u1");
    expect(p.ai.promptVersion).toBe("v");
  });
});

describe("balanceTime dan repairable", () => {
  it("tidak menyetel bila sudah pas atau selisih terlalu besar", () => {
    const r = structuredClone(gold);
    expect(balanceTime(r)).toBe(false);
    r.c.penutup[0].waktu += 30;
    expect(balanceTime(r)).toBe(false);
  });
  it("repairable membuang audit mandiri dan petunjuk", () => {
    const x = repairable([{ code: "RPM-05", level: "warn", message: "Konfirmasi: fase" }, { code: "RPM-19", level: "info", message: "kop" }, { code: "RPM-10", level: "error", message: "ritual" }]);
    expect(x.map((i) => i.code)).toEqual(["RPM-10"]);
  });
});

describe("validateGenInput", () => {
  it("menerima masukan sah dan memangkas teks", () => {
    const v = validateGenInput({ ...input, meta: { ...input.meta, topik: "  Norma  " } });
    expect(v.meta.topik).toBe("Norma");
  });
  it("menolak masukan tidak sah dengan pesan jelas", () => {
    expect(() => validateGenInput({ ...input, meta: { ...input.meta, topik: "" } })).toThrow(/Topik wajib/);
    expect(() => validateGenInput({ ...input, meta: { ...input.meta, grade: 9 } })).toThrow(/Kelas/);
    expect(() => validateGenInput({ ...input, meta: { ...input.meta, pertemuanKe: 3, dariPertemuan: 2 } })).toThrow(/Pertemuan/);
    expect(() => validateGenInput({ ...input, arahan: "x".repeat(2001) })).toThrow(/Arahan/);
    expect(() => validateGenInput({ ...input, cp: "x".repeat(70000) })).toThrow();
    expect(() => validateGenInput(null)).toThrow();
  });
});

describe("buildGenInput dan dasarOptions", () => {
  const tp: TpDoc = { ...emptyTp(), id: "tp1", status: "siap", mapelId: "ppkn", grade: 5, kko: "Menjelaskan", objek: "alasan aturan", konten: "norma", bukti: "tulisan", jp: 4, tahapan: ["a", "b", "c", "d"], caraAsesmen: "esai" };
  const cls = [{ id: "k1", name: "5A", grade: 5, fase: "C", yearLabel: "2026/2027" }] as ClassDoc[];
  const sc: ScaffoldDoc = { ...newScaffold(tp, "k1"), id: scaffoldId("tp1", "k1"), status: "siap" };
  sc.alternatif[0].tangga[0].kompetensi = "Mengamati dan mencatat";
  it("daftar dasar memuat tiap tangga dan pertemuan inti", () => {
    const o = dasarOptions(tp, [sc], cls);
    expect(o.some((x) => /5A, Alternatif 1, tangga 1: Mengamati/.test(x.label))).toBe(true);
    expect(o.at(-1)!.value).toMatch(/\|inti$/);
  });
  it("masukan yang dibangun lolos validasi dan memuat dasar tangga", () => {
    const g = buildGenInput({ tp, mapelNama: "PPKn", cpText: "CP", profile: mergedProfile({}, {}), meta: { topik: "Norma", semester: 1, jp: 2, menitPerJp: 35, pertemuanKe: 1, dariPertemuan: 2 }, arahan: "", dasarValue: `${sc.id}|a0|t0`, scaffolds: [sc], classes: cls });
    expect(g.dasar?.data.tangga).toMatchObject({ kompetensi: "Mengamati dan mencatat" });
    expect(g.profil).toHaveLength(5);
    expect(() => validateGenInput(g)).not.toThrow();
  });
});
