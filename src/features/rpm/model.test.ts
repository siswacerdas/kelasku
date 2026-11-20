import { describe, expect, it } from "vitest";
import { emptyTp, type TpDoc } from "../tp/model";
import { lengkap } from "./fixture";
import { alokasiMenit, ceklisStatus, emptyRpm, emptyKktp, lintRpm, maybeMultiAction, normalizeRpm, prefillFromTp, toStoredRpm, totalMenit, type Row, type RpmFields } from "./model";

const tp = (o: Partial<TpDoc> = {}): TpDoc => ({ ...emptyTp(), id: "tp1", status: "siap", mapelId: "ppkn", grade: 5, kko: "Menjelaskan", objek: "alasan aturan", konten: "norma", bukti: "tulisan singkat", jp: 2, caraAsesmen: "esai pendek dengan rubrik", ...o });

const codes = (r: RpmFields, ctx = {}) => lintRpm(r, { school: { name: "SD X", principalName: "Y" }, teacherName: "Z", ...ctx }).map((i) => i.code);

describe("lintRpm (RPM-1: contoh teruji buku saku harus lolos)", () => {
  it("RPM lengkap dari contoh buku saku lolos tanpa error dan saran", () => {
    const iss = lintRpm(lengkap(), { tp: tp(), school: { name: "SD X", principalName: "Y" }, teacherName: "Z" });
    expect(iss.filter((i) => i.level !== "info")).toEqual([]);
    expect(totalMenit(lengkap())).toBe(alokasiMenit(lengkap()));
  });
  it("kerangka kosong ditandai error pada bagian wajib", () => {
    const c = codes(emptyRpm());
    for (const k of ["RPM-01", "RPM-02", "RPM-03", "RPM-06", "RPM-10", "RPM-12", "RPM-13", "RPM-14", "RPM-15", "RPM-16"]) expect(c).toContain(k);
  });
});

describe("lintRpm (RPM-2: aturan per butir)", () => {
  it("total waktu harus sama dengan alokasi; waktu wajib di tiap baris", () => {
    const r = lengkap(); r.c.penutup[0].waktu = 5;
    expect(lintRpm(r).find((i) => i.code === "RPM-08")?.message).toMatch(/Lebih 3/);
    const r2 = lengkap(); r2.c.penutup[1].waktu = 0;
    expect(lintRpm(r2).some((i) => i.code === "RPM-08" && /wajib terisi/.test(i.message))).toBe(true);
  });
  it("ritual pembuka dan penutup wajib; tergabung dengan apersepsi diberi saran", () => {
    const r = lengkap(); r.c.pendahuluan = r.c.pendahuluan.filter((x) => !/salam/.test(x.kegiatan));
    expect(lintRpm(r).find((i) => i.code === "RPM-10")?.level).toBe("error");
    const g = lengkap(); g.c.pendahuluan[0].kegiatan = "Guru mengucap salam, berdoa, lalu menyampaikan tujuan pembelajaran hari ini.";
    expect(lintRpm(g).some((i) => i.code === "RPM-10" && /tergabung/.test(i.message))).toBe(true);
  });
  it("uji granularitas: baris yang menggabung banyak tindakan diberi saran", () => {
    expect(maybeMultiAction("Guru menjelaskan materi, memberi contoh, dan bertanya jawab dengan siswa.")).toBe(true);
    expect(maybeMultiAction("Guru menjelaskan materi lalu memberi contoh.")).toBe(true);
    expect(maybeMultiAction("Siswa berdiskusi dalam kelompok; guru berkeliling memantau dan menjawab pertanyaan.")).toBe(false);
  });
  it('"Langkah N" diberi saran', () => {
    const r = lengkap(); r.c.memahami[0].kegiatan = "Langkah 1: Guru membacakan cerita.";
    expect(codes(r)).toContain("RPM-07");
  });
  it("catatan tanpa alasan atau terisi di hampir semua baris diberi saran", () => {
    const r = lengkap(); r.c.memahami[0].catatan = "Bermakna";
    expect(lintRpm(r).some((i) => i.code === "RPM-11" && /belum menyebut prinsip/.test(i.message))).toBe(true);
    const r2 = lengkap(); for (const t of ["pendahuluan", "memahami", "mengaplikasi", "merefleksi", "penutup"] as const) r2.c[t].forEach((x) => { x.catatan = "🔎 Berkesadaran: siswa tahu alasan baris ini dilakukan."; });
    expect(lintRpm(r2).some((i) => i.code === "RPM-11" && /hampir di semua/.test(i.message))).toBe(true);
  });
  it("dimensi: 8 baris dan 2-3 bintang", () => {
    const r = lengkap(); r.b.dimensi[0].dominan = true; r.b.dimensi[3].dominan = true;
    expect(lintRpm(r).some((i) => i.code === "RPM-03" && /saat ini 4/.test(i.message))).toBe(true);
  });
  it("adaptasi tiga kategori wajib di tiap tahap inti", () => {
    const r = lengkap(); r.c.adaptasi.merefleksi.pemalu = "";
    expect(lintRpm(r).find((i) => i.code === "RPM-06")?.message).toMatch(/Merefleksi/);
  });
  it("status sumatif: formatif butuh peran, sumatif butuh instrumen sesuai KKO", () => {
    const r = lengkap(); r.d.sumatif = { status: "formatif", peran: "", instrumen: "" };
    expect(lintRpm(r).some((i) => i.code === "RPM-13" && i.level === "error")).toBe(true);
    const s = lengkap(); s.d.sumatif = { status: "sumatif", peran: "", instrumen: "tes pilihan ganda" };
    expect(lintRpm(s, { tp: tp({ kko: "Menjelaskan" }) }).some((i) => i.code === "RPM-13" && i.level === "warn")).toBe(true);
  });
  it("rubrik: butuh minimal satu jenis, masing-masing 4 level", () => {
    const r = lengkap(); r.d.rubrikPengetahuan = [];
    expect(codes(r)).toContain("RPM-14");
    const s = lengkap(); s.d.rubrikPengetahuan[0].l4 = "";
    expect(codes(s)).toContain("RPM-14");
  });
  it("KKTP harus terisi empat kolom", () => {
    const r = lengkap(); r.d.kktp = [emptyKktp()];
    expect(codes(r)).toContain("RPM-16");
  });
  it("PAK: isi harus konsisten; bila kosong tidak boleh ada sisa kolom PAK", () => {
    const r = lengkap(); r.a.elemenPak = "Ketaatan pada Aturan";
    const c = lintRpm(r).filter((i) => i.code === "RPM-17");
    expect(c.length).toBeGreaterThanOrEqual(3);
    const s = lengkap(); s.d.observasi.kolomPak = true;
    expect(lintRpm(s).some((i) => i.code === "RPM-18")).toBe(true);
  });
  it("data kop belum lengkap hanya memberi petunjuk", () => {
    expect(lintRpm(lengkap()).find((i) => i.code === "RPM-19")?.level).toBe("info");
  });
  it("audit mandiri yang belum dicentang memberi saran dan status 'belum'", () => {
    const r = lengkap(); r.konfirmasi.fase = false;
    const iss = lintRpm(r, { school: { name: "a", principalName: "b" }, teacherName: "c" });
    expect(iss.some((i) => i.code === "RPM-05")).toBe(true);
    const st = ceklisStatus(iss, r);
    expect(st).toHaveLength(19);
    expect(st.find((x) => x.code === "RPM-05")?.status).toBe("belum");
    expect(st.find((x) => x.code === "RPM-01")?.status).toBe("lolos");
  });
});

describe("normalizeRpm, toStoredRpm, prefillFromTp (DATA-1)", () => {
  it("dokumen sebagian dilengkapi nilai awal", () => {
    const n = normalizeRpm({ topik: "X", c: { pendahuluan: [{ waktu: 2, kegiatan: "a" } as Row] } as never });
    expect(n.c.memahami).toHaveLength(1);
    expect(n.c.pendahuluan[0].catatan).toBe("");
    expect(n.b.dimensi).toHaveLength(8);
    expect(n.d.observasi.perilaku).toEqual([""]);
  });
  it("hanya bidang RPM yang ditulis", () => {
    const stored = toStoredRpm({ ...lengkap(), id: "x", status: "siap" } as never) as Record<string, unknown>;
    for (const k of ["id", "status", "sumber"]) expect(stored).not.toHaveProperty(k);
  });
  it("awalan dari TP mengisi tautan, mapel, kelas, TP tahunan, dan CP", () => {
    const r = prefillFromTp(tp(), "Teks CP");
    expect(r).toMatchObject({ tpId: "tp1", mapelId: "ppkn", grade: 5 });
    expect(r.b.cp).toBe("Teks CP");
    expect(r.b.tpTahunan).toMatch(/^menjelaskan/);
  });
});
