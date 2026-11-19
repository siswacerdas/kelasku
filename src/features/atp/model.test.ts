import { describe, expect, it } from "vitest";
import { emptyTp, toStoredFields, type TpDoc } from "../tp/model";
import { labelMap, lintAlur, moveToGrade, moveWithin, rekapJp, sortTps } from "./model";

let n = 0;
const tp = (o: Partial<TpDoc> & { atp?: TpDoc["atp"] } = {}): TpDoc => ({ ...emptyTp(), id: `t${++n}`, status: "siap", mapelId: "bi", grade: 5, jp: 4, ...o });
const codes = (tps: TpDoc[], elemen: string[] = []) => lintAlur(tps, { fase: "C", elemen }).map((i) => i.code);

describe("urutan dan kode TP (ATP-1)", () => {
  it("diurutkan per kelas lalu urutan; yang belum diurutkan ditaruh paling akhir", () => {
    const a = tp({ id: "a", grade: 6, atp: { urutan: 1 } }), b = tp({ id: "b", grade: 5, atp: { urutan: 2 } }),
      c = tp({ id: "c", grade: 5, atp: { urutan: 1 } }), d = tp({ id: "d", grade: 5 });
    expect(sortTps([a, b, c, d]).map((t) => t.id)).toEqual(["c", "b", "d", "a"]);
    expect([...labelMap([a, b, c, d])]).toEqual([["c", "5.1"], ["b", "5.2"], ["d", "5.3"], ["a", "6.1"]]);
  });
  it("moveWithin menukar tetangga dan menomori ulang seluruh kolom", () => {
    const col = [tp({ id: "x", atp: { urutan: 1 } }), tp({ id: "y", atp: { urutan: 2 } }), tp({ id: "z", atp: { urutan: 3 } })];
    expect(moveWithin(col, "y", -1)).toEqual([{ id: "y", urutan: 1 }, { id: "x", urutan: 2 }, { id: "z", urutan: 3 }]);
    expect(moveWithin(col, "x", -1).map((u) => u.id)).toEqual(["x", "y", "z"]); // di ujung: tidak berubah
  });
  it("moveToGrade menaruh di akhir kolom tujuan dan merapikan kolom asal", () => {
    const all = [tp({ id: "a", grade: 5, atp: { urutan: 1 } }), tp({ id: "b", grade: 5, atp: { urutan: 2 } }), tp({ id: "c", grade: 6, atp: { urutan: 1 } })];
    expect(moveToGrade(all, "a", 6)).toEqual([{ id: "b", urutan: 1 }, { id: "a", grade: 6, urutan: 2 }]);
  });
});

describe("telaah alur (ATP-2)", () => {
  it("alur sehat tanpa temuan peringatan", () => {
    const a = tp({ id: "a", grade: 5, cpElemen: "Menulis", atp: { urutan: 1, alasan: "Fondasi proses menulis" } });
    const b = tp({ id: "b", grade: 6, cpElemen: "Menulis", atp: { urutan: 1, alasan: "Penguatan kalimat majemuk", prasyarat: ["a"] } });
    expect(lintAlur([a, b], { fase: "C", elemen: ["Menulis"] }).filter((i) => i.level !== "info")).toEqual([]);
  });
  it("prasyarat yang urutannya lebih akhir atau di kelas lebih akhir adalah error", () => {
    const a = tp({ id: "a", grade: 6, atp: { urutan: 1, alasan: "x" } });
    const b = tp({ id: "b", grade: 5, atp: { urutan: 1, alasan: "x", prasyarat: ["a"] } });
    expect(codes([a, b])).toContain("ATP-05");
  });
  it("lingkaran prasyarat dan prasyarat diri sendiri adalah error", () => {
    const a = tp({ id: "a", atp: { urutan: 1, alasan: "x", prasyarat: ["b"] } });
    const b = tp({ id: "b", atp: { urutan: 2, alasan: "x", prasyarat: ["a"] } });
    expect(codes([a, b])).toContain("ATP-06");
    expect(codes([tp({ id: "s", atp: { alasan: "x", prasyarat: ["s"] } })])).toContain("ATP-04");
  });
  it("prasyarat yang sudah dihapus diberi peringatan", () => {
    expect(codes([tp({ atp: { alasan: "x", prasyarat: ["hilang"] } })])).toContain("ATP-03");
  });
  it("semua TP di satu kelas, alasan kosong, elemen belum tercakup, dan catatan pendalaman kosong ditandai", () => {
    const c = codes([tp({ grade: 5 }), tp({ grade: 5, atp: { kontinuitas: "diperdalam" } })], ["Menyimak"]);
    for (const k of ["ATP-01", "ATP-02", "ATP-07", "ATP-09"]) expect(c).toContain(k);
  });
  it("tanpa TP hanya memberi petunjuk", () => {
    expect(codes([])).toEqual(["ATP-00"]);
  });
});

describe("rekap JP (Bagian VIII)", () => {
  it("menjumlahkan per elemen dan per kelas; TP tanpa elemen masuk baris mandiri", () => {
    const r = rekapJp([tp({ cpElemen: "Menulis", grade: 5, jp: 10 }), tp({ cpElemen: "Menulis", grade: 6, jp: 6 }), tp({ cpElemen: "", grade: 5, jp: 2 })], ["Menyimak", "Menulis"], [5, 6]);
    expect(r.rows.map((x) => [x.elemen, x.jumlah, x.jp])).toEqual([["Menyimak", 0, 0], ["Menulis", 2, 16], ["TP mandiri (tanpa elemen CP)", 1, 2]]);
    expect(r.total).toMatchObject({ jumlah: 3, jp: 18, perKelas: { 5: 12, 6: 6 } });
  });
});

describe("toStoredFields (DATA-1)", () => {
  it("hanya membawa bidang TP; id, status, dan atp tidak ikut tertulis", () => {
    const stored = toStoredFields(tp({ atp: { urutan: 3 } })) as Record<string, unknown>;
    expect(stored).not.toHaveProperty("id");
    expect(stored).not.toHaveProperty("status");
    expect(stored).not.toHaveProperty("atp");
    expect(stored).toHaveProperty("kko");
  });
});
