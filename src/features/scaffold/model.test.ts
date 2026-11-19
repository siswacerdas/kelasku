import { describe, expect, it } from "vitest";
import { emptyTp, type TpDoc } from "../tp/model";
import { emptyAlt, emptyTangga, lintScaffold, mergedProfile, newScaffold, normalizeScaffold, profileHash, toStoredScaffold, type ScaffoldFields, type Tangga } from "./model";

const tp = (o: Partial<TpDoc> = {}): TpDoc => ({ ...emptyTp(), id: "tp1", status: "siap", mapelId: "bi", grade: 5, kko: "Menulis", objek: "laporan pengamatan", konten: "objek nyata", bukti: "laporan sistematis", jp: 12, caraAsesmen: "rubrik struktur", ...o });
const tg = (o: Partial<Tangga> = {}): Tangga => ({ ...emptyTangga(), kompetensi: "Mengamati dan mencatat", materi: "tanaman pot di kelas", mengapa: "tanpa mencatat tidak ada bahan tulisan", tandaBerhasil: "mencatat tiga ciri objek", persiapanGuru: "siapkan tanaman", kalimatPembuka: "Apa yang kamu lihat?", diamati: "siapa yang berhenti mencatat", jikaBelum: "kembali ke satu ciri", bantuan: "penuh", ...o });
const lengkap = (): ScaffoldFields => {
  const s = newScaffold(tp(), "kls1");
  s.analisis = { kkoMakna: "menyusun tulisan dari catatan", buktiTercapai: "laporan runtut", bukanTermasuk: "menyalin format isian", prasyarat: "mencatat poin", materiTerpilih: "tanaman pot", alasanMateri: "sekolah minim lahan terbuka, objek dalam kelas", konten: [{ konten: "pengamatan objek", status: "WAJIB" }] };
  s.diagnostik = { tugas: "Amati satu benda dan tulis tiga ciri (10 menit)", caraMembaca: "lihat apakah ciri spesifik", keputusanAwal: "mulai tangga 1 bila belum" };
  s.alternatif[0] = { nama: "Alternatif 1", jenis: "bertahap-tunggal", rasional: "Cocok jika kelas heterogen", uji: { sederhana: "ya", fondasi: "ya", cukup: "ya" }, tangga: [tg({ bantuan: "penuh" }), tg({ bantuan: "sedang" })] };
  s.alternatif[1] = { nama: "Alternatif 2", jenis: "kontras-berpasangan", rasional: "Cocok jika kelas homogen dan cepat", uji: { sederhana: "ya", fondasi: "ya", cukup: "ya" }, tangga: [tg({ bantuan: "sedikit" })] };
  s.inti = { kompetensi: "menulis laporan pengamatan", materiPuncak: "objek pilihan siswa di kelas", bentukAsesmen: "laporan dinilai dengan rubrik struktur", instrumen: "rubrik 4 level" };
  s.rangsangan = "bersama"; s.objekPengamatan = "dalam-kelas";
  return s;
};
const prof = (p: Parameters<typeof mergedProfile>[0] = {}, k: Parameters<typeof mergedProfile>[1] = {}) => mergedProfile(p, k);
const run = (s: ScaffoldFields, o: { tp?: TpDoc | undefined; p?: ReturnType<typeof prof> } = {}) => {
  const p = o.p ?? prof();
  return lintScaffold(s, { tp: "tp" in o ? o.tp : tp(), profile: p, profilHashNow: profileHash(p) });
};
const codes = (...a: Parameters<typeof run>) => run(...a).map((i) => i.code);

describe("lintScaffold (SC-1: contoh lengkap lolos)", () => {
  it("scaffold lengkap tanpa error dan peringatan", () => {
    expect(run(lengkap()).filter((i) => i.level !== "info")).toEqual([]);
  });
  it("kerangka kosong dari newScaffold ditandai error pada bagian wajib", () => {
    const c = codes(newScaffold(tp(), "k"));
    for (const k of ["SC-01", "SC-04", "SC-10", "SC-11", "SC-20"]) expect(c).toContain(k);
  });
});

describe("lintScaffold (SC-2: aturan)", () => {
  it("kurang dari 2 alternatif adalah error", () => {
    const s = lengkap(); s.alternatif = s.alternatif.slice(0, 1);
    expect(codes(s)).toContain("SC-06");
  });
  it("bantuan yang membesar diberi peringatan (1H)", () => {
    const s = lengkap(); s.alternatif[0].tangga = [tg({ bantuan: "sedikit" }), tg({ bantuan: "penuh" })];
    expect(codes(s)).toContain("SC-15");
  });
  it("kriteria kualitatif pada tanda keberhasilan (1F)", () => {
    const s = lengkap(); s.alternatif[0].tangga[0].tandaBerhasil = "tulisan yang indah";
    expect(codes(s)).toContain("SC-16");
  });
  it("uji validitas Tidak adalah error; belum dijawab adalah peringatan", () => {
    const s = lengkap(); s.alternatif[0].uji.cukup = "tidak";
    expect(codes(s)).toContain("SC-14");
    s.alternatif[0].uji.cukup = "";
    expect(run(s).find((i) => i.code === "SC-14")?.level).toBe("warn");
  });
  it("kelas heterogen tanpa alternatif bertahap tunggal diberi peringatan", () => {
    const s = lengkap(); s.alternatif[0].jenis = "kontras-berpasangan";
    expect(codes(s, { p: prof({}, { kemampuan: "B" }) })).toContain("SC-08");
    expect(codes(s, { p: prof({}, { kemampuan: "A" }) })).not.toContain("SC-08");
  });
  it("kesenjangan signifikan dengan rangsangan pribadi adalah error (1G)", () => {
    const s = lengkap(); s.rangsangan = "pribadi";
    expect(run(s, { p: prof({}, { kesenjangan: "A" }) }).find((i) => i.code === "SC-22")?.level).toBe("error");
    expect(run(s, { p: prof({}, { kesenjangan: "B" }) }).some((i) => i.code === "SC-22" && i.level === "error")).toBe(false);
  });
  it("objek luar kelas di sekolah minim lahan diberi peringatan (1E)", () => {
    const s = lengkap(); s.objekPengamatan = "luar-kelas";
    expect(codes(s, { p: prof({ lokasi: "A" }) })).toContain("SC-23");
    expect(codes(s, { p: prof({ lokasi: "B" }) })).not.toContain("SC-23");
  });
  it("media digital saat fasilitas terbatas diberi peringatan", () => {
    const s = lengkap(); s.alternatif[0].tangga[0].media = "digital";
    expect(codes(s, { p: prof({ digital: "B" }) })).toContain("SC-17");
    expect(codes(s, { p: prof({ digital: "A" }) })).not.toContain("SC-17");
  });
  it("TP performatif dengan siswa kurang percaya diri butuh tangga kelompok kecil", () => {
    const t = tp({ kko: "Menyajikan", caraAsesmen: "presentasi dengan rubrik" });
    const s = lengkap();
    expect(codes(s, { tp: t, p: prof({}, { percayaDiri: "B" }) })).toContain("SC-18");
    s.alternatif.forEach((a) => a.tangga.push(tg({ skala: "kelompok-kecil" })));
    expect(codes(s, { tp: t, p: prof({}, { percayaDiri: "B" }) })).not.toContain("SC-18");
  });
  it("tangga wajib melebihi JP TP diberi peringatan", () => {
    expect(codes(lengkap(), { tp: tp({ jp: 4 }) })).toContain("SC-19");
  });
  it("profil berubah sejak disusun diberi peringatan", () => {
    const s = lengkap(); s.profilHash = "lama";
    expect(codes(s)).toContain("SC-07");
  });
  it("TP tidak ada adalah error; TP draf adalah peringatan", () => {
    expect(codes(lengkap(), { tp: undefined })).toContain("SC-00");
    expect(run(lengkap(), { tp: tp({ status: "draf" }) }).find((i) => i.code === "SC-00")?.level).toBe("warn");
  });
  it("bentuk asesmen inti yang sering salah untuk KKO-nya diberi peringatan", () => {
    const s = lengkap(); s.inti.bentukAsesmen = "tes pilihan ganda";
    expect(codes(s, { tp: tp({ kko: "Menjelaskan" }) })).toContain("SC-21");
  });
});

describe("normalizeScaffold dan toStoredScaffold (DATA-1)", () => {
  it("dokumen sebagian dilengkapi nilai awal tanpa merusak struktur", () => {
    const n = normalizeScaffold({ tpId: "a", classId: "b", alternatif: [{ nama: "X" } as never] });
    expect(n.alternatif[0].tangga).toEqual([]);
    expect(n.alternatif[0].uji).toEqual({ sederhana: "", fondasi: "", cukup: "" });
    expect(n.analisis.konten).toEqual([]);
    expect(n.jpPerPertemuan).toBe(2);
  });
  it("hanya bidang scaffold yang ditulis", () => {
    const stored = toStoredScaffold({ ...lengkap(), id: "x", status: "siap" } as never) as Record<string, unknown>;
    expect(stored).not.toHaveProperty("id");
    expect(stored).not.toHaveProperty("status");
  });
  it("hash profil berubah bila jawaban berubah", () => {
    expect(profileHash(prof())).not.toBe(profileHash(prof({ digital: "A" })));
    expect(emptyAlt().tangga).toHaveLength(1);
  });
});
