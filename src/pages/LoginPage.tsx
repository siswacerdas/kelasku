import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function LoginPage() {
  const { user, loading, error, signInWithGoogle } = useAuth();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
      <section className="flex flex-col justify-center bg-ink px-8 py-16 text-paper sm:px-16">
        <p className="font-display text-xl font-semibold text-chalk">Kelasku</p>
        <h1 className="mt-6 max-w-xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">
          Isi sekali, perangkat ajar tersusun sendiri.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-mist">
          Rencana pembelajaran, modul ajar, asesmen, dan rekap nilai saling tersambung,
          jadi Anda tidak mengetik hal yang sama berulang kali.
        </p>
      </section>

      <section className="flex flex-col justify-center px-8 py-16 sm:px-16">
        <h2 className="font-display text-2xl font-semibold">Masuk ke ruang kerja Anda</h2>
        <p className="mt-2 text-moss">Gunakan akun Google yang biasa Anda pakai mengajar.</p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-8 w-full max-w-sm rounded-lg bg-chalk px-5 py-3 font-semibold text-ink transition hover:brightness-95 disabled:opacity-60"
        >
          Masuk dengan Google
        </button>

        {error && (
          <p role="alert" className="mt-4 max-w-sm rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
