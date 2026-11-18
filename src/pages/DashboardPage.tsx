import { useAuth } from "../features/auth/AuthContext";

const alur = [
  { judul: "Rencana pembelajaran", isi: "Tujuan, pemahaman bermakna, dan pengalaman belajar mendalam untuk satu topik.", status: "Berikutnya" },
  { judul: "Modul ajar", isi: "Disusun otomatis dari rencana pembelajaran, siap diekspor ke Word atau PDF.", status: "Segera" },
  { judul: "Perangkat asesmen", isi: "Soal, rubrik, dan lembar observasi yang terhubung ke tujuan pembelajaran.", status: "Segera" },
  { judul: "Rekap nilai", isi: "Nilai siswa terkumpul per tujuan pembelajaran tanpa menyalin ulang.", status: "Segera" },
];

export default function DashboardPage() {
  const { user, error, logout } = useAuth();

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <header className="flex items-center justify-between">
        <p className="font-display text-xl font-extrabold">Kelasku</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-moss">{user?.displayName ?? user?.email}</span>
          <button onClick={logout} className="rounded-md border border-mist px-3 py-1.5 font-medium hover:bg-mist">
            Keluar
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <h1 className="mt-14 font-display text-4xl font-extrabold">
        Selamat datang{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-3 max-w-xl text-lg text-moss">
        Administrasi mengajar Anda dibangun berurutan. Setiap tahap memakai hasil tahap sebelumnya.
      </p>

      <ol className="mt-12 border-l-4 border-mist">
        {alur.map((a, i) => (
          <li key={a.judul} className="relative pb-10 pl-8 last:pb-0">
            <span
              className={`absolute -left-[14px] top-1 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                i === 0 ? "bg-chalk text-ink" : "bg-mist text-moss"
              }`}
            >
              {i + 1}
            </span>
            <h2 className="font-display text-xl font-semibold">{a.judul}</h2>
            <p className="mt-1 max-w-lg text-moss">{a.isi}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{a.status}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
