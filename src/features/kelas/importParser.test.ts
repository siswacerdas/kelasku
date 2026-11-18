import { describe, expect, it } from "vitest";
import { markAgainstExisting, parseGrid, parseText } from "./importParser";
import { buildTemplateBuffer, readStudentRows } from "./excel";

const names = (r: ReturnType<typeof parseText>) => r.rows.filter((x) => !x.skip).map((x) => x.student.name);

describe("parseText (KELAS-1)", () => {
  it("membaca tempelan Excel (tab) dengan judul", () => {
    const r = parseText("Nama\tNIS\tNISN\tJenis Kelamin\nAhmad Fauzi\t1001\t0123456789\tL\nSiti Aisyah\t1002\t\tPerempuan");
    expect(r.usedHeader).toBe(true);
    expect(r.rows.map((x) => x.student)).toEqual([
      { name: "Ahmad Fauzi", nis: "1001", nisn: "0123456789", gender: "L" },
      { name: "Siti Aisyah", nis: "1002", nisn: "", gender: "P" },
    ]);
  });

  it("kolom boleh diacak, dikurangi, dan kolom asing diabaikan", () => {
    const r = parseText("Telepon\tNama Siswa\tL/P\n081\tBudi\tlaki-laki");
    expect(r.rows[0].student).toEqual({ name: "Budi", nis: "", nisn: "", gender: "L" });
  });

  it("satu nama per baris tanpa judul", () => {
    const r = parseText("Budi Santoso\nSiti Aisyah\n\nRaka");
    expect(names(r)).toEqual(["Budi Santoso", "Siti Aisyah", "Raka"]);
    expect(r.usedHeader).toBe(false);
  });

  it("banyak kolom tanpa judul memakai urutan Nama, NIS, NISN, JK", () => {
    const r = parseText("Budi;1001;0123456789;L");
    expect(r.rows[0].student).toEqual({ name: "Budi", nis: "1001", nisn: "0123456789", gender: "L" });
  });

  it("nama siswa yang kebetulan 'Siswa' tidak dianggap judul", () => {
    expect(names(parseText("Siswa\nBudi"))).toEqual(["Siswa", "Budi"]);
  });

  it("melewati baris contoh dan baris kosong; NIS ganda ditolak; nama ganda hanya peringatan", () => {
    const r = parseText("Nama,NIS\n(contoh) A,1\nBudi,10\nBudi,11\nAni,10");
    expect(r.rows.map((x) => [x.student.name, x.skip])).toEqual([["Budi", false], ["Budi", false], ["Ani", true]]);
    expect(r.rows[1].problems.some((p) => p.level === "warn")).toBe(true);
  });

  it("mendukung CSV bertanda kutip", () => {
    expect(names(parseText('Nama,NIS\n"Fauzi, Ahmad",1'))).toEqual(["Fauzi, Ahmad"]);
  });

  it("jenis kelamin tak dikenal hanya peringatan; nama kosong ditolak", () => {
    const r = parseGrid([["Nama", "JK"], ["Budi", "?"], ["", "L"]]);
    expect(r.rows[0].skip).toBe(false);
    expect(r.rows[0].student.gender).toBe("");
    expect(r.rows[1].skip).toBe(true);
  });

  it("batas jumlah baris", () => {
    const r = parseText(Array.from({ length: 305 }, (_, i) => `Siswa ${i}`).join("\n"));
    expect(r.tooMany).toBe(true);
    expect(r.rows).toHaveLength(300);
  });
});

describe("markAgainstExisting", () => {
  it("NIS sudah ada dilewati, nama sama diberi peringatan", () => {
    const r = markAgainstExisting(parseText("Nama\tNIS\nBudi\t1\nAni\t2").rows, [{ name: "Ani", nis: "9" }, { name: "Lain", nis: "1" }]);
    expect(r[0].skip).toBe(true);
    expect(r[1].skip).toBe(false);
    expect(r[1].problems.some((p) => p.level === "warn")).toBe(true);
  });
});

describe("template Excel (KELAS-1: template yang diunduh harus terbaca kembali)", () => {
  it("template kosong terbaca: judul dikenali, baris contoh dilewati", async () => {
    const grid = await readStudentRows(await buildTemplateBuffer());
    const r = parseGrid(grid);
    expect(r.usedHeader).toBe(true);
    expect(r.rows).toHaveLength(0);
  });
});
