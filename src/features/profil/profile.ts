/**
 * Profil konteks dan Peta Keputusan (Buku Saku Scaffolding SD v2, Bagian I.2 dan II).
 * Murni dan teruji. Kontrak: PROFIL-1 dan PROFIL-2 di docs/ANTI-REGRESI.md.
 * Jawaban "Tidak tahu" (atau belum diisi) langsung memakai default konservatif dan ditandai sebagai asumsi.
 */
export type Choice = "A" | "B" | "?";
export type ProfileKey = "lokasi" | "digital" | "kemampuan" | "kesenjangan" | "percayaDiri";
export type Profile = Partial<Record<ProfileKey, Choice>>;

type Def = {
  key: ProfileKey;
  scope: "sekolah" | "kelas";
  question: string;
  a: string;
  b: string;
  defaultChoice: "A" | "B";
  affects: string;
  decisionA: string;
  decisionB: string;
};

export const DEFS: Def[] = [
  {
    key: "lokasi", scope: "sekolah",
    question: "Bagaimana lokasi dan lingkungan sekitar sekolah?",
    a: "Kota padat, minim lahan atau ruang terbuka", b: "Pinggiran atau desa dengan akses alam terbuka",
    defaultChoice: "A",
    affects: "Pemilihan objek dan konteks materi pengamatan",
    decisionA: "Gunakan objek dalam kelas atau lingkungan buatan sebagai default.",
    decisionB: "Boleh memakai objek alam nyata di luar kelas sebagai materi puncak.",
  },
  {
    key: "digital", scope: "sekolah",
    question: "Bagaimana fasilitas digital (internet, proyektor) di kelas?",
    a: "Memadai di kelas", b: "Terbatas atau tidak ada",
    defaultChoice: "B",
    affects: "Variasi jenis media di setiap tangga pembelajaran",
    decisionA: "Variasikan teks, infografis, dan video untuk memperluas paparan kosakata dan konteks.",
    decisionB: "Fokus pada teks cetak, benda nyata, dan interaksi lisan; jangan merancang materi yang bergantung teknologi.",
  },
  {
    key: "kemampuan", scope: "kelas",
    question: "Bagaimana kemampuan awal kelas ini?",
    a: "Cenderung homogen", b: "Heterogen (rentang lebar)",
    defaultChoice: "B",
    affects: "Pilihan jenis alternatif scaffolding",
    decisionA: "Alternatif bertahap tunggal dan alternatif kontras berpasangan sama-sama layak; pilih sesuai gaya mengajar Anda.",
    decisionB: "Prioritaskan alternatif bertahap tunggal: satu jalur dengan bantuan yang menyusut, lebih inklusif untuk rentang kemampuan lebar.",
  },
  {
    key: "kesenjangan", scope: "kelas",
    question: "Bagaimana kesenjangan ekonomi atau latar belakang siswa?",
    a: "Signifikan", b: "Tidak signifikan",
    defaultChoice: "A",
    affects: "Bentuk rangsangan untuk tujuan yang menuntut gagasan atau pendapat dari titik kosong",
    decisionA: "Wajib memakai rangsangan bersama (gambar, situasi, atau cerita yang sama untuk seluruh kelas); jangan bersandar pada pengalaman pribadi siswa.",
    decisionB: "Pengalaman pribadi siswa boleh dipakai sebagai bahan.",
  },
  {
    key: "percayaDiri", scope: "kelas",
    question: "Seberapa terbiasa siswa tampil di depan kelas?",
    a: "Sudah terbiasa", b: "Masih perlu banyak pembiasaan",
    defaultChoice: "B",
    affects: "Jumlah tangga performatif dan kecepatan menuju kelompok besar",
    decisionA: "Tangga bisa dipercepat dan dimulai dari kelompok sedang.",
    decisionB: "Tambahkan tangga tampil di kelompok kecil lebih dulu sebelum kelas besar.",
  },
];

export const SCHOOL_KEYS: ProfileKey[] = ["lokasi", "digital"];
export const CLASS_KEYS: ProfileKey[] = ["kemampuan", "kesenjangan", "percayaDiri"];

export type Resolved = {
  key: ProfileKey;
  question: string;
  affects: string;
  answer: "A" | "B";
  source: "guru" | "default";
  decision: string;
};

export function resolveProfile(keys: ProfileKey[], profile: Profile | undefined): Resolved[] {
  return keys.map((key) => {
    const d = DEFS.find((x) => x.key === key)!;
    const given = profile?.[key];
    const explicit = given === "A" || given === "B";
    const answer = explicit ? given : d.defaultChoice;
    return {
      key, question: d.question, affects: d.affects, answer,
      source: explicit ? "guru" : "default",
      decision: answer === "A" ? d.decisionA : d.decisionB,
    };
  });
}

/** Banyaknya variabel yang benar-benar dijawab guru (bukan asumsi). */
export const countAnswered = (keys: ProfileKey[], profile: Profile | undefined) =>
  keys.filter((k) => profile?.[k] === "A" || profile?.[k] === "B").length;

export const SOURCE_LABEL = {
  guru: "berdasarkan jawaban Anda",
  default: "asumsi default, mohon koreksi jika keliru",
} as const;
