import { describe, expect, it } from "vitest";
import { buildRpmTemplate, readSheets, writeSheets } from "./excel";
import { emptyRpm, lintRpm, normalizeRpm, type RpmFields } from "./model";
import { rpmToSheets, sheetsToRpm, templateSheets } from "./template";

const resolve = (n: string) => (/pkn|pancasila/i.test(n) ? "ppkn" : "");
function isi(): RpmFields {
  const r = emptyRpm();
  Object.assign(r, { mapelId: "ppkn", grade: 5, semester: 2, topik: "Norma dan aturan", jp: 2, menitPerJp: 35, pertemuanKe: 1, dariPertemuan: 3 });
  r.a.pengetahuanAwal = "Sudah mengenal aturan kelas"; r.a.elemenPak = "Ketaatan pada Aturan"; r.b.cp = "CP teks"; r.b.tpTahunan = "Menjelaskan alasan aturan"; r.b.tpHarian = "Menjelaskan mengapa aturan disepakati";
  r.b.indikator = ["Menyebut dua dampak", "Menjelaskan alasan"];
  r.b.dimensi = r.b.dimensi.map((d, i) => ({ ...d, catatan: `catatan ${i + 1}`, dominan: i === 1 || i === 2 }));
  r.c.pendahuluan = [{ waktu: 1, kegiatan: "Guru mengucap salam dan berdoa.", catatan: "" }, { waktu: 3, kegiatan: "Guru bertanya pemantik.", catatan: "😊 Menggembirakan: pertanyaan terbuka dan ringan." }];
  r.c.memahami = [{ waktu: 5, kegiatan: "Guru membacakan cerita.", catatan: "" }];
  r.c.adaptasi.memahami = { cepat: "c1", lambat: "l1", pemalu: "p1" };
  r.d.diagnostik = { tugas: "tulis aturan", cara: "lihat alasan", tindakLanjut: "dampingi" };
  r.d.sumatif = { status: "sumatif", peran: "", instrumen: "esai pendek" };
  r.d.rubrikPengetahuan = [{ aspek: "Alasan", l1: "a", l2: "b", l3: "c", l4: "d" }];
  r.d.rubrikKinerja = [{ aspek: "Diskusi", l1: "a", l2: "b", l3: "c", l4: "d" }];
  r.d.observasi = { perilaku: ["Menyimak", "Berpendapat"], kolomPak: true };
  r.d.kktp = [{ jenis: "Pengetahuan", level: "Standar", deskriptor: "menjelaskan", bukti: "tulisan" }];
  return r;
}
const strip = (r: RpmFields) => { const { konfirmasi, tpId, ...rest } = normalizeRpm(r); void konfirmasi; void tpId; return rest; };

describe("template RPM (RPM-3: terbaca kembali)", () => {
  it("RPM -> lembar -> RPM menghasilkan isi yang sama", () => {
    const orig = isi();
    const { rpm, notes } = sheetsToRpm(rpmToSheets(orig, "PPKn"), resolve);
    expect(notes).toEqual([]);
    expect(strip(rpm)).toEqual(strip(orig));
  });
  it("template kosong terbaca: tidak ada kegiatan (baris contoh dilewati) dan tidak ada catatan galat", () => {
    const { rpm, notes } = sheetsToRpm(templateSheets(), resolve);
    expect(notes).toEqual([]);
    expect(rpm.c.pendahuluan).toHaveLength(1);
    expect(rpm.c.pendahuluan[0].kegiatan).toBe("");
  });
  it("lewat berkas Excel sungguhan: template dan RPM terisi terbaca kembali", async () => {
    const blank = sheetsToRpm(await readSheets(await buildRpmTemplate()), resolve);
    expect(blank.notes).toEqual([]);
    const sheets = await readSheets(await writeSheets(rpmToSheets(isi(), "PPKn")));
    const { rpm } = sheetsToRpm(sheets, resolve);
    expect(strip(rpm)).toEqual(strip(isi()));
  });
  it("kode tak dikenal dan mapel tak dikenal dilaporkan, bukan diam-diam", () => {
    const s = rpmToSheets(isi(), "Mapel Aneh");
    s.Isi.push(["ZZ9", "x", "nilai", ""]);
    const { rpm, notes } = sheetsToRpm(s, resolve);
    expect(notes.some((n) => /ZZ9/.test(n))).toBe(true);
    expect(notes.some((n) => /Mapel Aneh/.test(n))).toBe(true);
    expect(rpm.mapelId).toBe("");
  });
  it("urutan kolom boleh diacak dan label diubah selama kode utuh; lembar lain boleh hilang dengan catatan", () => {
    const s = rpmToSheets(isi(), "PPKn");
    s.Isi = [s.Isi[0], ...s.Isi.slice(1).reverse().map((r) => [r[0], "label lain", r[2], "x"])];
    delete s.Rubrik;
    const { rpm } = sheetsToRpm(s, resolve);
    expect(rpm.b.tpTahunan).toBe("Menjelaskan alasan aturan");
    expect(rpm.d.rubrikPengetahuan).toEqual([]);
  });
  it("hasil impor langsung dapat ditelaah (RPM tidak dipercaya sebelum diperiksa)", () => {
    const { rpm } = sheetsToRpm(rpmToSheets(isi(), "PPKn"), resolve);
    expect(lintRpm(rpm).some((i) => i.code === "RPM-01")).toBe(true);
  });
});
