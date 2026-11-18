import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";

const alur = [
  { judul: "Rencana pembelajaran", isi: "Tujuan, pemahaman bermakna, dan pengalaman belajar untuk satu topik.", to: "/app/perencanaan/rencana" },
  { judul: "Modul ajar", isi: "Disusun dari rencana pembelajaran, siap diekspor ke Word atau PDF.", to: "/app/perencanaan/modul" },
  { judul: "Perangkat asesmen", isi: "Soal, rubrik, dan lembar observasi yang terhubung ke tujuan pembelajaran.", to: "/app/asesmen" },
  { judul: "Rekap nilai", isi: "Nilai siswa terkumpul per tujuan pembelajaran tanpa menyalin ulang.", to: "/app/nilai" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const namaDepan = user?.displayName?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={namaDepan ? `Selamat datang, ${namaDepan}.` : "Selamat datang."}
        description="Setiap tahap administrasi memakai hasil tahap sebelumnya, jadi Anda mengisi sekali saja."
      />

      {/* Layar lebar: dua kolom, kolom kanan tetap sehingga isi tidak menyisakan ruang kosong. */}
      <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]">
        <section>
          <h2 className="font-display text-2xl font-semibold">Lanjutkan pekerjaan</h2>
          <div className="garis-buku mt-4 max-w-3xl pb-3">
            <p>Belum ada dokumen. Mulailah dari kelas Anda, lalu susun</p>
            <p>rencana pembelajaran pertama. Semua dokumen berikutnya</p>
            <p>akan terisi dari data yang sama.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/app/kelas" className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">
              Tambah kelas
            </Link>
            <Link to="/app/perencanaan/rencana" className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist">
              Susun rencana pembelajaran
            </Link>
          </div>
        </section>

        <aside>
          <h2 className="font-display text-2xl font-semibold">Alur kerja</h2>
          <ol className="mt-4 border-l-4 border-mist">
            {alur.map((a, i) => (
              <li key={a.judul} className="relative pb-8 pl-8 last:pb-0">
                <span
                  className={`absolute -left-[14px] top-1 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                    i === 0 ? "bg-chalk text-ink" : "bg-mist text-moss"
                  }`}
                >
                  {i + 1}
                </span>
                <Link to={a.to} className="font-display text-lg font-semibold hover:underline">
                  {a.judul}
                </Link>
                <p className="mt-1 text-moss">{a.isi}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
