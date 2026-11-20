/** Skema keluaran per bagian (input_schema untuk tool use) agar model selalu mengembalikan JSON terstruktur. */
import { DIMENSI } from "../rpm/model";

type J = Record<string, unknown>;
const s = (description: string): J => ({ type: "string", description });
const arr = (items: J, description: string, minItems?: number, maxItems?: number): J => ({ type: "array", items, description, ...(minItems ? { minItems } : {}), ...(maxItems ? { maxItems } : {}) });
const obj = (properties: Record<string, J>, required: string[] = Object.keys(properties)): J => ({ type: "object", properties, required });

const row = obj({
  waktu: { type: "integer", minimum: 1, description: "Durasi baris dalam menit (bilangan bulat, minimal 1)" },
  kegiatan: s("Satu tindakan konkret, ditulis seperti skenario yang bisa dijalankan guru pengganti"),
  catatan: s("Kosong kecuali baris ini benar-benar mencerminkan prinsip; bila diisi: emoji, nama prinsip, alasan singkat"),
});
const adapt = obj({ cepat: s("Adaptasi untuk siswa cepat"), lambat: s("Adaptasi untuk siswa lambat"), pemalu: s("Adaptasi untuk siswa pemalu") });
const rubrik = obj({ aspek: s("Aspek yang dinilai"), l1: s("Deskriptor level Belum Terlihat"), l2: s("Deskriptor level Mulai Terlihat"), l3: s("Deskriptor level Berkembang Sesuai Harapan"), l4: s("Deskriptor level Sangat Berkembang") });

export const SCHEMA_AB = obj({
  a: obj({
    pengetahuanAwal: s("A.2 pengetahuan awal"), minat: s("A.2 minat dan latar belakang"), gayaBelajar: s("A.2 gaya belajar dominan"), kebutuhan: s("A.2 kebutuhan spesifik"), implikasi: s("A.2 implikasi bagi pembelajaran"),
    esensial: s("A.3 pengetahuan esensial"), aplikatif: s("A.3 pengetahuan aplikatif"), nilaiKarakter: s("A.3 nilai-karakter"), elemenPak: s("A.3 elemen PAK; KOSONGKAN bila tidak ada kaitan alami"), relevansi: s("A.3 relevansi kehidupan nyata"), kesulitan: s("A.3 tingkat kesulitan"),
  }),
  b: obj({
    cp: s("B.1 CP, disalin apa adanya dari konteks"), tpTahunan: s("B.2 TP tahunan"), tpHarian: s("B.2 TP harian untuk pertemuan ini"),
    indikator: arr({ type: "string" }, "B.2 indikator terukur, 1 sampai 3", 1, 3), elemenPak: s("B.2 elemen PAK; harus konsisten dengan A.3 (kosong bila kosong)"),
    konteks: s("B.3 topik atau konteks nyata"), praktik: s("B.5 model/strategi beserta alasan kesesuaian fase"), kemitraan: s("B.6 kemitraan; tulis 'tidak relevan' bila tidak ada"), lingkungan: s("B.7 lingkungan dan sarana"),
    dimensi: arr(obj({ nama: { type: "string", enum: DIMENSI, description: "Nama dimensi" }, catatan: s("Satu baris catatan"), dominan: { type: "boolean", description: "true untuk 2 sampai 3 dimensi dominan" } }), "Ke-8 dimensi, urut sesuai daftar", 8, 8),
  }),
});

export const SCHEMA_C = obj({
  pendahuluan: arr(row, "Tabel Pendahuluan", 4), memahami: arr(row, "Tabel Memahami", 3), mengaplikasi: arr(row, "Tabel Mengaplikasi", 3), merefleksi: arr(row, "Tabel Merefleksi", 3), penutup: arr(row, "Tabel Penutup", 3),
  adaptasi: obj({ memahami: adapt, mengaplikasi: adapt, merefleksi: adapt }),
  catatanPak: s("Catatan pemetaan Temukan-Bayangkan-Lakukan-Bagikan; kosong bila Elemen PAK kosong"),
});

export const SCHEMA_D = obj({
  diagnostik: obj({ tugas: s("Tugas 5 sampai 15 menit"), cara: s("Cara membaca hasil"), tindakLanjut: s("Tindak lanjut") }),
  formatif: obj({ minimal: s("Kriteria Minimal"), standar: s("Kriteria Standar"), lanjutan: s("Kriteria Lanjutan") }),
  sumatif: obj({ status: { type: "string", enum: ["formatif", "sumatif"], description: "Status asesmen akhir" }, peran: s("Bila formatif-saja: pertemuan/RPM pembawa sumatif; kosong bila sumatif"), instrumen: s("Bila sumatif: instrumen sesuai KKO TP; kosong bila formatif-saja") }),
  rubrikPengetahuan: arr(rubrik, "Rubrik pengetahuan (boleh kosong bila tidak relevan)"), rubrikKinerja: arr(rubrik, "Rubrik kinerja (boleh kosong bila tidak relevan)"),
  observasi: obj({ perilaku: arr({ type: "string" }, "Perilaku atau kompetensi teramati", 1), kolomPak: { type: "boolean", description: "true hanya bila Elemen PAK terisi" } }),
  kktp: arr(obj({ jenis: s("Pengetahuan atau Kinerja"), level: s("Level yang dituju"), deskriptor: s("Deskriptor capaian"), bukti: s("Bukti dari RPM ini") }), "Tabel KKTP", 1),
});

/** Perbaikan: bagian mana pun boleh dikembalikan utuh; bagian yang tidak perlu diubah dihilangkan. */
export const SCHEMA_PATCH = {
  type: "object",
  properties: { a: (SCHEMA_AB.properties as Record<string, J>).a, b: (SCHEMA_AB.properties as Record<string, J>).b, c: SCHEMA_C, d: SCHEMA_D },
  required: [],
};

export const TOOLS = {
  ab: { name: "susun_bagian_ab", description: "Menyerahkan bagian A (analisis) dan B (desain pembelajaran) RPM.", schema: SCHEMA_AB },
  c: { name: "susun_bagian_c", description: "Menyerahkan bagian C (pengalaman belajar: lima tabel dan adaptasi) RPM.", schema: SCHEMA_C },
  d: { name: "susun_bagian_d", description: "Menyerahkan bagian D (asesmen) RPM.", schema: SCHEMA_D },
  patch: { name: "perbaiki_rpm", description: "Menyerahkan bagian RPM yang sudah diperbaiki secara utuh (hanya bagian yang diubah).", schema: SCHEMA_PATCH },
} as const;
