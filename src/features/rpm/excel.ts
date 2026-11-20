/** Template dan pembaca Excel untuk RPM. exceljs dimuat dinamis (hanya saat tombol dipakai). */
import { SHEET, templateSheets, type Sheets } from "./template";

async function lib() {
  return (await import("exceljs")).default;
}
function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as { richText?: { text: string }[]; text?: unknown; result?: unknown };
    if (o.richText) return o.richText.map((x) => x.text).join("");
    if (o.result !== undefined) return cellToString(o.result);
    if (o.text !== undefined) return cellToString(o.text);
  }
  return "";
}

const WIDTHS: Record<string, number[]> = {
  [SHEET.isi]: [8, 30, 70, 46], [SHEET.dimensi]: [5, 26, 60, 26], [SHEET.kegiatan]: [16, 9, 14, 80, 50], [SHEET.adaptasi]: [16, 50, 50, 50],
  [SHEET.rubrik]: [24, 30, 30, 30, 30, 30], [SHEET.observasi]: [60, 20], [SHEET.kktp]: [28, 26, 50, 40],
};

export async function writeSheets(sheets: Sheets, petunjuk: string[] = []): Promise<Uint8Array> {
  const ExcelJS = await lib();
  const wb = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    rows.forEach((r) => ws.addRow(r));
    (WIDTHS[name] ?? []).forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    ws.eachRow((row) => row.eachCell((c) => { c.alignment = { wrapText: true, vertical: "top" }; }));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
  }
  if (petunjuk.length) {
    const g = wb.addWorksheet("Petunjuk");
    g.getColumn(1).width = 110;
    petunjuk.forEach((p, i) => { const row = g.addRow([p]); if (i === 0) row.font = { bold: true, size: 14 }; row.alignment = { wrapText: true }; });
  }
  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

export async function readSheets(data: ArrayBuffer | Uint8Array): Promise<Sheets> {
  const ExcelJS = await lib();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data as never);
  const out: Sheets = {};
  wb.eachSheet((ws) => {
    const grid: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => { grid[n - 1] = Array.from((row.values as unknown[]).slice(1), (v) => cellToString(v)); });
    out[ws.name] = Array.from(grid, (r) => r ?? []);
  });
  return out;
}

export const PETUNJUK = [
  "Petunjuk pengisian template RPM Kelasku",
  "1. Lembar Isi: isi kolom Isi (kolom C). Kolom Kode (A) JANGAN diubah; label dan petunjuk boleh disesuaikan.",
  "2. Lembar Kegiatan: satu baris untuk satu tindakan. Tahap: Pendahuluan, Memahami, Mengaplikasi, Merefleksi, Penutup. Waktu wajib di setiap baris dan jumlahnya harus sama dengan alokasi waktu.",
  "3. Kolom Catatan hanya diisi pada baris yang relevan (Berkesadaran, Bermakna, Menggembirakan) disertai alasan singkat. Biarkan kosong pada baris lain.",
  "4. Lembar Adaptasi wajib terisi untuk Cepat, Lambat, dan Pemalu pada tiga tahap inti.",
  "5. Lembar Dimensi: tulis catatan untuk ke-8 dimensi dan tulis ya pada 2 sampai 3 dimensi dominan.",
  "6. Lembar Rubrik: isi Rubrik Pengetahuan dan/atau Kinerja, masing-masing 4 level. Lembar Observasi dan KKTP juga wajib terisi.",
  "7. Baris yang diawali (contoh) akan dilewati. Setelah diunggah, RPM dibuka di editor agar Anda memeriksanya sebelum disimpan.",
];
export const buildRpmTemplate = () => writeSheets(templateSheets(), PETUNJUK);
