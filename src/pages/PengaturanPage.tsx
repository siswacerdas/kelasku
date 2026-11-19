import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import ProfileQuestions from "../features/profil/ProfileQuestions";
import { SCHOOL_KEYS, type Choice, type ProfileKey } from "../features/profil/profile";
import { emptySchool, emptyTeacher, subscribeWorkspace, updateWorkspace, type SchoolData, type TeacherData, type WorkspaceDoc } from "../features/settings/api";

const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";

export default function PengaturanPage() {
  const { user } = useAuth();
  const ws = user?.uid ?? "";
  const [doc, setDoc] = useState<WorkspaceDoc | null>(null);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ws) return;
    return subscribeWorkspace(ws, (d) => {
      setDoc(d);
      // Formulir diisi sekali dari data tersimpan; setelah itu milik pengguna sampai disimpan.
      setSchool((s) => s ?? { ...emptySchool, ...d.school });
      setTeacher((t) => t ?? { ...emptyTeacher, name: user?.displayName ?? "", ...d.teacher });
    }, () => setError(true));
  }, [ws, user?.displayName]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!school || !teacher) return;
    setStatus(null);
    try {
      await updateWorkspace(ws, { school, teacher });
      setStatus("Data tersimpan.");
    } catch {
      setStatus("Data belum tersimpan. Periksa koneksi, lalu coba lagi.");
    }
  }
  async function changeProfile(k: ProfileKey, c: Choice) {
    try {
      await updateWorkspace(ws, { profile: { ...doc?.profile, [k]: c } });
      setProfileStatus("Tersimpan.");
    } catch {
      setProfileStatus("Belum tersimpan. Coba lagi.");
    }
  }
  const set = <T extends object>(setter: React.Dispatch<React.SetStateAction<T | null>>, k: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setter((o) => (o ? { ...o, [k]: e.target.value } : o));

  return (
    <>
      <PageHeader title="Pengaturan" description="Data yang dicetak pada kop dan tanda tangan dokumen, serta profil sekolah untuk perencanaan." />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">Pengaturan tidak dapat dimuat. Muat ulang halaman.</p>}
      {!school || !teacher ? (
        !error && <p className="mt-10 text-moss">Memuat…</p>
      ) : (
        <div className="mt-10 grid gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <form onSubmit={save}>
            <h2 className="font-display text-2xl font-semibold">Sekolah dan guru</h2>
            <p className="mt-1 max-w-[65ch] text-moss">Dipakai pada kop, tabel identitas, dan blok pengesahan dokumen. Boleh dikosongkan; dokumen akan memberi tempat isian.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className="font-medium">Nama sekolah</span><input className={field} value={school.name} onChange={set(setSchool, "name")} /></label>
              <label className="block sm:col-span-2"><span className="font-medium">Alamat sekolah</span><input className={field} value={school.address} onChange={set(setSchool, "address")} /></label>
              <label className="block"><span className="font-medium">Kota (untuk tempat dan tanggal)</span><input className={field} value={school.city} onChange={set(setSchool, "city")} /></label>
              <span />
              <label className="block"><span className="font-medium">Nama kepala sekolah</span><input className={field} value={school.principalName} onChange={set(setSchool, "principalName")} /></label>
              <label className="block"><span className="font-medium">NIP/NIK kepala sekolah</span><input className={field} value={school.principalId} onChange={set(setSchool, "principalId")} inputMode="numeric" /></label>
              <label className="block"><span className="font-medium">Nama guru</span><input className={field} value={teacher.name} onChange={set(setTeacher, "name")} /></label>
              <label className="block"><span className="font-medium">NIP/NIK guru</span><input className={field} value={teacher.id} onChange={set(setTeacher, "id")} inputMode="numeric" /></label>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">Simpan data</button>
              {status && <p role="status" className="text-sm font-medium">{status}</p>}
            </div>
            <p className="mt-8 text-moss">Paket Anda: <span className="font-semibold text-ink">{doc?.plan === "free" ? "Gratis" : doc?.plan}</span></p>
          </form>

          <section>
            <h2 className="font-display text-2xl font-semibold">Profil sekolah</h2>
            <p className="mt-1 max-w-[65ch] text-moss">Dijawab sekali. Setiap jawaban langsung memperlihatkan dampaknya pada perencanaan. Yang belum diketahui, pilih "Tidak tahu".</p>
            <ProfileQuestions keys={SCHOOL_KEYS} value={doc?.profile} onChange={changeProfile} />
            {profileStatus && <p role="status" className="text-sm font-medium">{profileStatus}</p>}
            <p className="mt-4 max-w-[65ch] text-sm text-moss">Profil kelas (kemampuan awal, kesenjangan, kepercayaan diri) diisi per kelas di halaman Kelas & siswa.</p>
          </section>
        </div>
      )}
    </>
  );
}
