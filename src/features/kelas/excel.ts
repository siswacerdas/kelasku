/**
 * Template dan pembaca Excel (.xlsx). Memuat exceljs secara dinamis, jadi pustaka besar ini
 * hanya diunduh saat guru menekan "Unduh template" atau memilih berkas.
 */
async function lib() {
  return (await import("exceljs")).default;
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as { richText?: { text: string }[]; text?: unknown; result?: unknown };
    if (o.richText) return o.richText.map((t) => t.text).join("");
    if (o.result !== undefined) return cellToString(o.result);
    if (o.text !== undefined) return cellToString(o.text);
  }
  return "";
}

export async function buildTemplateBuffer(): Promise<Uint8Array> {
  const ExcelJS = await lib();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Siswa", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Nama", key: "name", width: 34 },
    { header: "NIS", key: "nis", width: 14, style: { numFmt: "@" } },
    { header: "NISN", key: "nisn", width: 16, style: { numFmt: "@" } },
    { header: "Jenis Kelamin", key: "gender", width: 16 },
  ];
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FF14302B" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8B730" } };
  ws.addRow({ name: "(contoh) Ahmad Fauzi", nis: "1001", nisn: "0123456789", gender: "L" });
  ws.addRow({ name: "(contoh) Siti Aisyah", nis: "1002", nisn: "0123456790", gender: "P" });
  // dataValidations ada di exceljs tetapi belum ada di file tipenya
  (ws as unknown as { dataValidations: { add: (range: string, rule: object) => void } }).dataValidations.add("D2:D300", {
    type: "list", allowBlank: true, formulae: ['"L,P"'],
  });

  const guide = wb.addWorksheet("Petunjuk");
  guide.getColumn(1).width = 100;
  [
    "Petunjuk pengisian daftar siswa Kelasku",
    "1. Isi data mulai baris ke-2 pada lembar Siswa. Hapus dua baris contoh, atau biarkan: baris yang diawali (contoh) akan dilewati.",
    "2. Hanya kolom Nama yang wajib. NIS, NISN, dan Jenis Kelamin (L atau P) boleh dikosongkan.",
    "3. Template boleh disesuaikan: urutan kolom boleh diubah dan kolom selain Nama boleh dihapus. Kolom dikenali dari judulnya.",
    "4. Kolom dengan judul lain akan diabaikan. Jangan mengubah judul Nama, NIS, NISN, dan Jenis Kelamin.",
    "5. Kolom NIS dan NISN sudah berformat teks agar angka 0 di depan tidak hilang.",
    "6. Satu berkas untuk satu kelas. Maksimal 300 siswa per impor.",
  ].forEach((t, i) => {
    const row = guide.addRow([t]);
    if (i === 0) row.font = { bold: true, size: 14 };
  });
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

/** Mengembalikan sel-sel lembar "Siswa" (atau lembar pertama). Nomor baris Excel dipertahankan. */
export async function readStudentRows(data: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const ExcelJS = await lib();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data as never);
  const ws = wb.getWorksheet("Siswa") ?? wb.worksheets[0];
  const grid: string[][] = [];
  if (!ws) return grid;
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    const vals = (row.values as unknown[]).slice(1);
    grid[n - 1] = Array.from(vals, (v) => cellToString(v));
  });
  return grid;
}
