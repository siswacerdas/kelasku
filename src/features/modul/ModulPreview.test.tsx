import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { lengkapModul } from "./fixture";
import ModulPreview from "./ModulPreview";

const render = (showKunci: boolean) => {
  const m = lengkapModul();
  m.asesmenAkhir[0].kunci = "RAHASIA-KUNCI";
  m.elemenPak = "RAHASIA-ELEMEN-PAK";
  m.subunit[1].pakWujud = "RAHASIA-CATATAN-PAK";
  m.subunit[0].nilaiIslami = ["RAHASIA-CATATAN-ISLAMI"];
  return renderToStaticMarkup(createElement(ModulPreview, { m, mapelNama: "PPKn", sekolah: "SD Contoh", showKunci, onToggleKunci: () => {}, onBack: () => {} }));
};

describe("ModulPreview (PRIV-1: hanya teks siswa yang tampil)", () => {
  it("memuat isi siswa: judul, pengantar, pemantik, bacaan, aktivitas, latihan, refleksi, produk", () => {
    const html = render(false);
    for (const t of ["Aturan dan Kita", "Pengantar", "Sebelum Kita Mulai", "Pernahkah kamu melihat teman antre", "Yuk, Mengamati", "Refleksiku", "Karyaku", "SD Contoh"]) expect(html).toContain(t);
    expect(html.match(/Bagian \d: /g)).toHaveLength(4);
  });
  it("tidak membocorkan kunci jawaban maupun catatan guru ke tampilan siswa", () => {
    const html = render(false);
    for (const secret of ["RAHASIA-KUNCI", "RAHASIA-ELEMEN-PAK", "RAHASIA-CATATAN-PAK", "RAHASIA-CATATAN-ISLAMI", "Kunci Jawaban"]) expect(html).not.toContain(secret);
  });
  it("kunci hanya tampil di halaman guru bila diminta, tanpa catatan penyusun", () => {
    const html = render(true);
    expect(html).toContain("Kunci Jawaban (khusus guru)");
    expect(html).toContain("RAHASIA-KUNCI");
    expect(html).not.toContain("RAHASIA-CATATAN-PAK");
  });
  it("bagian cetak: kontrol ditandai tersembunyi saat cetak", () => {
    expect(render(false)).toContain("print:hidden");
  });
});
