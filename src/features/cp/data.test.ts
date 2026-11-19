import { describe, expect, it } from "vitest";
import raw from "../../data/cp.json";
import { searchCp, type CpData } from "./data";

const data = raw as unknown as CpData;

describe("Bank CP (CP-1: integritas data)", () => {
  it("memuat 16 mata pelajaran dan 67 elemen", () => {
    expect(data.mapel).toHaveLength(16);
    expect(data.mapel.reduce((n, m) => n + m.elemen.length, 0)).toBe(67);
  });
  it("id unik dan setiap elemen punya teks CP untuk setiap fase mapelnya", () => {
    expect(new Set(data.mapel.map((m) => m.id)).size).toBe(16);
    for (const m of data.mapel)
      for (const e of m.elemen)
        for (const f of m.fase) expect(e.cp[f]?.length ?? 0, `${m.id} / ${e.nama} / ${f}`).toBeGreaterThan(20);
  });
  it("fase sesuai sumber: Koding hanya Fase C; IPAS, Kemuhammadiyahan, Bahasa Arab mulai Fase B", () => {
    const f = (id: string) => data.mapel.find((m) => m.id === id)!.fase;
    expect(f("kka")).toEqual(["C"]);
    for (const id of ["ipas", "kemuh", "barab"]) expect(f(id)).toEqual(["B", "C"]);
    expect(f("bi")).toEqual(["A", "B", "C"]);
  });
  it("tiga mapel ISMUBA ditandai berbeda sumbernya", () => {
    expect(data.mapel.filter((m) => m.sumber === "ismuba-2024").map((m) => m.id)).toEqual(["alislam", "kemuh", "barab"]);
  });
});

describe("searchCp", () => {
  it("semua kata harus cocok; tanpa kata kunci tidak ada hasil", () => {
    expect(searchCp(data, "")).toEqual([]);
    const r = searchCp(data, "menyimak aural");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((h) => h.mapel.id === "bi")).toBe(true);
    expect(searchCp(data, "zzzxxyy")).toEqual([]);
  });
});
