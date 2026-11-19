import { describe, expect, it } from "vitest";
import { CLASS_KEYS, SCHOOL_KEYS, countAnswered, resolveProfile } from "./profile";

describe("Peta Keputusan Profil (PROFIL-1, PROFIL-2)", () => {
  it("tanpa jawaban, semua memakai default konservatif dan ditandai asumsi", () => {
    const r = resolveProfile([...SCHOOL_KEYS, ...CLASS_KEYS], {});
    expect(Object.fromEntries(r.map((x) => [x.key, x.answer]))).toEqual({
      lokasi: "A", digital: "B", kemampuan: "B", kesenjangan: "A", percayaDiri: "B",
    });
    expect(r.every((x) => x.source === "default")).toBe(true);
  });

  it('"Tidak tahu" sama dengan belum diisi: langsung default', () => {
    const [x] = resolveProfile(["digital"], { digital: "?" });
    expect(x.answer).toBe("B");
    expect(x.source).toBe("default");
  });

  it("jawaban guru mengganti default dan ditandai sebagai jawaban guru", () => {
    const [x] = resolveProfile(["digital"], { digital: "A" });
    expect(x.answer).toBe("A");
    expect(x.source).toBe("guru");
    expect(x.decision).toMatch(/video/);
  });

  it("aturan pemetaan sesuai buku saku", () => {
    const get = (k: Parameters<typeof resolveProfile>[0][0], c: "A" | "B") => resolveProfile([k], { [k]: c })[0].decision;
    expect(get("kesenjangan", "A")).toMatch(/rangsangan bersama/);
    expect(get("kesenjangan", "B")).toMatch(/pengalaman pribadi/i);
    expect(get("kemampuan", "B")).toMatch(/bertahap tunggal/);
    expect(get("percayaDiri", "B")).toMatch(/kelompok kecil/);
    expect(get("lokasi", "B")).toMatch(/objek alam/);
  });

  it("menghitung jawaban nyata saja", () => {
    expect(countAnswered(CLASS_KEYS, { kemampuan: "A", kesenjangan: "?" })).toBe(1);
  });
});
