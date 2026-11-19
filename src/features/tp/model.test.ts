import { describe, expect, it } from "vitest";
import { composeTp, emptyTp, lintTp, type TpFields } from "./model";

// Contoh terisi dari Buku Saku CP-ATP-TP Bagian V (Bahasa Indonesia, Fase C): harus lolos tanpa error dan peringatan.
const baik = (): TpFields => ({
  ...emptyTp(), mapelId: "bi", grade: 5, cpElemen: "Menulis",
  kko: "Menulis", objek: "laporan hasil pengamatan sederhana", konten: "objek atau peristiwa nyata di sekitar",
  bukti: "laporan dengan urutan sistematis dan kalimat majemuk dasar", jp: 10,
  tahapan: [
    "Menentukan objek pengamatan bersama, mendiskusikan apa yang perlu dicatat (bukan langsung disodori format isian)",
    "Melakukan pengamatan langsung dan mencatat poin penting",
    "Menyusun catatan menjadi paragraf dengan bimbingan urutan logis, diulang dengan objek berbeda",
    "Saling membaca dan memberi masukan sebelum versi akhir",
  ],
  caraAsesmen: "Hasil tulisan dinilai dengan rubrik struktur (bukan hanya kerapian), dibandingkan dengan catatan pengamatan awal.",
  tidakDipakai: "Format isian siap pakai sebagai produk akhir yang dinilai.",
  uji: { kerangka: "tidak", jenjang: "tidak", caraUkur: "tidak", genre: "tidak" },
});
const codes = (t: TpFields, ctx?: Parameters<typeof lintTp>[1]) => lintTp(t, ctx).map((i) => i.code);

describe("lintTp (TP-1: contoh acuan buku saku harus lolos)", () => {
  it("contoh terisi dari buku saku lolos tanpa error dan peringatan", () => {
    expect(lintTp(baik()).filter((i) => i.level !== "info")).toEqual([]);
  });
  it("TP kosong: semua kolom wajib ditandai error", () => {
    const c = codes(emptyTp());
    for (const k of ["TP-00", "TP-01", "TP-04", "TP-05", "TP-08"]) expect(c).toContain(k);
  });
});

describe("lintTp (TP-2: aturan per kolom)", () => {
  it("tahapan kurang dari 4 langkah adalah error", () => {
    const t = baik(); t.tahapan = t.tahapan.slice(0, 3);
    expect(codes(t)).toContain("TP-05");
  });
  it("tanpa langkah membandingkan/merevisi/berlatih diberi peringatan", () => {
    const t = baik(); t.tahapan = ["Guru menjelaskan konsep dahulu di depan kelas", "Siswa mencatat penjelasan guru dengan rapi", "Siswa menyusun laporan akhir sendiri", "Siswa mengumpulkan laporan akhir ke guru"];
    expect(codes(t)).toContain("TP-07");
  });
  it("cara asesmen generik diberi peringatan; berisi instrumen tidak", () => {
    const t = baik(); t.caraAsesmen = "Soal tertulis pascamateri.";
    expect(codes(t)).toContain("TP-09");
    t.caraAsesmen = "Soal tertulis dan rubrik struktur.";
    expect(codes(t)).not.toContain("TP-09");
  });
  it("menganalisis tanpa objek terinci diberi peringatan", () => {
    const t = baik(); t.kko = "Menganalisis"; t.objek = "informasi";
    expect(codes(t)).toContain("TP-02");
  });
  it("KKO fase lebih tinggi dari kelasnya diberi peringatan", () => {
    const t = baik(); t.grade = 1; t.kko = "Menganalisis"; t.objek = "sebab akibat peristiwa";
    expect(codes(t)).toContain("TP-03");
  });
  it("bentuk asesmen yang sering salah untuk KKO-nya diberi peringatan", () => {
    const t = baik(); t.kko = "Menjelaskan"; t.caraAsesmen = "Tes pilihan ganda dan rubrik.";
    expect(codes(t)).toContain("TP-10");
  });
  it("kriteria kualitatif tanpa indikator diberi peringatan", () => {
    const t = baik(); t.bukti = "karangan yang indah dan menarik"; t.caraAsesmen = "Guru menilai karangan secara keseluruhan melalui catatan.";
    expect(codes(t)).toContain("TP-11");
  });
  it("uji pemisahan: Ya adalah error, belum dijawab adalah peringatan", () => {
    const t = baik(); t.uji.genre = "ya";
    expect(codes(t)).toContain("TP-13");
    t.uji.genre = "";
    expect(codes(t)).toContain("TP-14");
  });
  it("mapel tanpa CP untuk fase tersebut adalah error", () => {
    const t = baik(); t.mapelId = "ipas"; t.grade = 1;
    expect(codes(t, { mapelFase: ["B", "C"] })).toContain("TP-00");
  });
  it("TP mandiri hanya diberi info, tidak memblokir", () => {
    const t = baik(); t.cpElemen = "";
    expect(lintTp(t).filter((i) => i.level !== "info")).toEqual([]);
  });
});

describe("composeTp", () => {
  it("menyusun kalimat operasional dan memberi penanda untuk bagian kosong", () => {
    expect(composeTp({ kko: "Menjelaskan", objek: "sebab banjir", konten: "lingkungan sekitar", bukti: "tulisan singkat." }))
      .toBe("Siswa harus bisa menjelaskan sebab banjir tentang lingkungan sekitar yang dibuktikan dengan tulisan singkat.");
    expect(composeTp({ kko: "", objek: "", konten: "", bukti: "" })).toContain("[kata kerja]");
  });
});
