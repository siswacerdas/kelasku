import { describe, expect, it } from "vitest";
import { lengkapModul } from "./fixture";
import { ceklisStatus, emptyModul, emptySoal, lintModul, normalizeModul, prefillFromScaffold, studentTexts, toStoredModul, type ModulFields } from "./model";

const codes = (m: ModulFields, ctx = {}) => lintModul(m, ctx).map((i) => i.code);
const lvl = (m: ModulFields, code: string) => lintModul(m).filter((i) => i.code === code).map((i) => i.level);

describe("lintModul (MOD-1: modul acuan lengkap lolos)", () => {
  it("modul acuan lolos tanpa error dan saran", () => {
    expect(lintModul(lengkapModul()).filter((i) => i.level !== "info")).toEqual([]);
  });
  it("kerangka kosong ditandai error pada komponen wajib", () => {
    const c = codes(emptyModul());
    for (const k of ["MOD-00", "MOD-03", "MOD-04", "MOD-06", "MOD-07", "MOD-08", "MOD-10"]) expect(c).toContain(k);
  });
  it("14 butir ceklis tampil, semuanya lolos untuk modul acuan", () => {
    const st = ceklisStatus(lintModul(lengkapModul()));
    expect(st).toHaveLength(14);
    expect(st.every((x) => x.status === "lolos")).toBe(true);
  });
});

describe("lintModul (MOD-2: aturan per butir)", () => {
  it("MOD-01: istilah teknis guru di teks siswa ditandai; kunci jawaban tidak ikut diperiksa", () => {
    const m = lengkapModul(); m.subunit[1].bacaan[0] += " Ini sesuai TP kita.";
    expect(lvl(m, "MOD-01")).toEqual(["error"]);
    const k = lengkapModul(); k.asesmenAkhir[0].kunci = "sesuai CP dan TP";
    expect(codes(k)).not.toContain("MOD-01");
  });
  it('MOD-01: kata "Pak" biasa tidak dianggap PAK; singkatan huruf kecil dalam kata tidak ikut', () => {
    const m = lengkapModul(); m.subunit[0].pemantik[0] = "Apa kata Pak Guru tentang tptp dan cpu? Pernahkah kamu bertanya?";
    expect(codes(m)).not.toContain("MOD-01");
    expect(codes(m)).not.toContain("MOD-11");
  });
  it("MOD-02: jumlah subunit harus sama dengan jumlah tangga; di luar 3-6 diberi saran", () => {
    const m = lengkapModul(); m.jumlahTangga = 5;
    expect(lvl(m, "MOD-02")).toContain("error");
    const k = lengkapModul(); k.subunit.push({ ...k.subunit[3] }); k.subunit.push({ ...k.subunit[2] }); k.subunit.push({ ...k.subunit[1] }); k.jumlahTangga = 7;
    expect(lvl(k, "MOD-02")).toContain("warn");
  });
  it("MOD-03: produk wajib, diumumkan di pengantar, mulai sejak subunit tengah, dan ada soal terbuka di akhir", () => {
    const a = lengkapModul(); a.pengantar.produk = "";
    expect(lvl(a, "MOD-03")).toContain("error");
    const b = lengkapModul(); b.produk.mulaiSubunit = 1;
    expect(lvl(b, "MOD-03")).toEqual(["warn"]);
    const c = lengkapModul(); c.asesmenAkhir = [emptySoal("isian")].map((s) => ({ ...s, teks: "x", kunci: "y" }));
    expect(lvl(c, "MOD-03")).toContain("error");
  });
  it("MOD-04: asesmen awal 4-8 soal, tidak terbuka, bermotivasi", () => {
    const a = lengkapModul(); a.asesmenAwal.soal = a.asesmenAwal.soal.slice(0, 2);
    expect(lvl(a, "MOD-04")).toContain("error");
    const b = lengkapModul(); b.asesmenAwal.soal[0].jenis = "uraian";
    expect(lvl(b, "MOD-04")).toContain("warn");
    const c = lengkapModul(); c.asesmenAwal.motivasi = "Semangat!";
    expect(lvl(c, "MOD-04")).toContain("warn");
  });
  it("MOD-05: kriteria pintu masuk belum dikonfirmasi dan subunit pertama terlalu panjang diberi saran", () => {
    const a = lengkapModul(); a.pintuMasuk.toleran = false;
    expect(codes(a)).toContain("MOD-05");
    const b = lengkapModul(); b.subunit[0].bacaan = [...b.subunit[1].bacaan, ...b.subunit[1].bacaan];
    expect(codes(b)).toContain("MOD-05");
  });
  it("MOD-06: pemantik wajib, dan orientasi tidak boleh memuat pertanyaan", () => {
    const a = lengkapModul(); a.subunit[0].pemantik = [""];
    expect(lvl(a, "MOD-06")).toContain("error");
    const b = lengkapModul(); b.subunit[1].orientasi += " Mengapa aturan penting?";
    expect(lvl(b, "MOD-06")).toContain("warn");
  });
  it("MOD-07: PG+BS maks 50%, wajib uraian dan penerapan, 3-8 soal", () => {
    const a = lengkapModul(); a.subunit[2].formatif = [{ ...a.subunit[2].formatif[0] }, { ...a.subunit[2].formatif[0], jenis: "bs" }, { ...a.subunit[2].formatif[0], jenis: "pg" }];
    const msgs = lintModul(a).filter((i) => i.code === "MOD-07").map((i) => i.message).join(" ");
    expect(msgs).toMatch(/50%/); expect(msgs).toMatch(/uraian/); expect(msgs).toMatch(/penerapan/);
    const b = lengkapModul(); b.subunit[0].formatif = b.subunit[0].formatif.slice(0, 2);
    expect(lvl(b, "MOD-07")).toContain("error");
  });
  it("MOD-08: refleksi pribadi wajib di setiap subunit (2-3)", () => {
    const a = lengkapModul(); a.subunit[3].refleksi = ["Satu saja?"];
    expect(lvl(a, "MOD-08")).toContain("error");
    const b = lengkapModul(); b.subunit[3].refleksi = ["a?", "b?", "c?", "d?"];
    expect(lvl(b, "MOD-08")).toEqual(["warn"]);
  });
  it("MOD-09: pola aktivitas dan latihan yang berulang diberi saran; kombinasi aktivitas wajib ada", () => {
    const a = lengkapModul(); a.subunit[1].aktivitas.jenis = a.subunit[2].aktivitas.jenis = "mengamati"; a.subunit[1].formatif = a.subunit[2].formatif;
    expect(codes(a)).toContain("MOD-09");
    const b = lengkapModul(); b.subunit[1].aktivitas.jenis = "menulis";
    expect(lintModul(b).some((i) => i.code === "MOD-09" && /berdiskusi/.test(i.message))).toBe(true);
  });
  it("MOD-10: dimensi harus punya wujud tugas (label saja adalah error), 2-4 dimensi", () => {
    const a = lengkapModul(); a.dimensiFokus[0].wujud = "";
    expect(lvl(a, "MOD-10")).toContain("error");
    const b = lengkapModul(); b.dimensiFokus = [b.dimensiFokus[0]];
    expect(lvl(b, "MOD-10")).toContain("warn");
  });
  it("MOD-11/12: PAK muncul sebagai cerita tanpa istilah ke siswa dan tidak dipaksakan", () => {
    const a = lengkapModul(); a.elemenPak = "Ketaatan pada Aturan";
    expect(lvl(a, "MOD-11")).toContain("error");
    a.subunit[1].pakWujud = "Kasus antre sebagai pemantik dan refleksi tentang kejujuran";
    expect(codes(a)).not.toContain("MOD-11");
    a.subunit[1].refleksi[0] = "Apa itu pendidikan antikorupsi menurutmu?";
    expect(lvl(a, "MOD-11")).toContain("error");
    const b = lengkapModul(); b.subunit[0].pakWujud = "dipaksakan";
    expect(lvl(b, "MOD-12")).toEqual(["warn"]);
  });
  it("MOD-13: format cetak tanpa interaktif; format keduanya butuh padanan cetak", () => {
    const a = lengkapModul(); a.subunit[1].aktivitas.interaktif = true;
    expect(lvl(a, "MOD-13")).toContain("error");
    a.format = "keduanya";
    expect(lvl(a, "MOD-13")).toContain("error");
    a.subunit[1].aktivitas.padananCetak = "Tabel isian gunting-tempel";
    expect(codes(a)).not.toContain("MOD-13");
    a.format = "digital"; a.subunit[1].aktivitas.padananCetak = "";
    expect(codes(a)).not.toContain("MOD-13");
  });
  it("MOD-14: nilai Islami maksimal 2 titik per subunit; dapat dimatikan per sekolah", () => {
    const a = lengkapModul(); a.subunit[0].nilaiIslami = ["a", "b", "c"];
    expect(lvl(a, "MOD-14")).toEqual(["warn"]);
    expect(codes(a, { islami: false })).not.toContain("MOD-14");
  });
  it("bahasa per fase: panjang paragraf mengikuti fase", () => {
    const m = lengkapModul(); m.grade = 1;
    expect(codes(m)).toContain("MOD-F");
  });
});

describe("normalizeModul, toStoredModul, prefillFromScaffold, studentTexts (DATA-1)", () => {
  it("dokumen sebagian dilengkapi nilai awal", () => {
    const n = normalizeModul({ judul: "X", subunit: [{ judul: "a" } as never] });
    expect(n.subunit[0].formatif).toHaveLength(3);
    expect(n.subunit[0].aktivitas.langkah).toEqual([""]);
    expect(n.pengantar.salam).toBe("");
    expect(n.pintuMasuk.sederhana).toBe(false);
  });
  it("hanya bidang modul yang ditulis", () => {
    const stored = toStoredModul({ ...lengkapModul(), id: "x", status: "siap" } as never) as Record<string, unknown>;
    for (const k of ["id", "status", "sumber"]) expect(stored).not.toHaveProperty(k);
  });
  it("awalan dari scaffolding: jumlah subunit = jumlah tangga, judul dari kompetensi tangga", () => {
    const m = prefillFromScaffold({ tpId: "tp1", mapelId: "ppkn", grade: 5, semester: 1, tangga: [{ kompetensi: "Mengamati aturan" }, { kompetensi: "Menjelaskan alasan" }, { kompetensi: "Menerapkan" }] });
    expect(m.subunit.map((s) => s.judul)).toEqual(["Mengamati aturan", "Menjelaskan alasan", "Menerapkan"]);
    expect(m.jumlahTangga).toBe(3);
  });
  it("teks siswa tidak memuat kunci jawaban maupun catatan penyusun", () => {
    const m = lengkapModul(); m.asesmenAkhir[0].kunci = "RAHASIA-KUNCI"; m.subunit[0].pakWujud = "RAHASIA-PAK";
    const all = studentTexts(m).map((x) => x.text).join(" ");
    expect(all).not.toContain("RAHASIA");
  });
});
