import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import PageHeader from "../components/PageHeader";
import { deleteClass, subscribeClasses, subscribeStudents } from "../features/kelas/api";
import type { ClassDoc, StudentDoc } from "../features/kelas/types";
import ClassForm from "../features/kelas/ClassForm";
import StudentList from "../features/kelas/StudentList";
import AddStudentsPanel from "../features/kelas/AddStudentsPanel";

const btn = "rounded-lg border-2 border-ink px-4 py-2.5 font-semibold hover:bg-mist";

export default function KelasPage() {
  const { user } = useAuth();
  const ws = user?.uid ?? "";
  const [classes, setClasses] = useState<ClassDoc[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentDoc[] | null>(null);
  const [form, setForm] = useState<null | "new" | "edit">(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadError = () => setError("Data tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman.");

  useEffect(() => (ws ? subscribeClasses(ws, setClasses, loadError) : undefined), [ws]);
  useEffect(() => {
    if (classes && !classes.some((c) => c.id === selectedId)) setSelectedId(classes[0]?.id ?? null);
  }, [classes, selectedId]);
  useEffect(() => {
    setStudents(null);
    setPanelOpen(false);
    setConfirmDelete(false);
    return ws && selectedId ? subscribeStudents(ws, selectedId, setStudents, loadError) : undefined;
  }, [ws, selectedId]);

  const selected = classes?.find((c) => c.id === selectedId) ?? null;

  async function removeClass() {
    if (!selected) return;
    try {
      await deleteClass(ws, selected.id);
    } catch {
      setError("Kelas belum terhapus. Coba lagi.");
    }
    setConfirmDelete(false);
  }

  return (
    <>
      <PageHeader
        title="Kelas & siswa"
        description="Data induk yang dipakai semua dokumen. Isi sekali di sini."
        actions={<button onClick={() => setForm("new")} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95">Tambah kelas</button>}
      />
      {error && <p role="alert" className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {form && classes && (
        <ClassForm
          key={form === "edit" ? selected?.id : "new"}
          ws={ws}
          initial={form === "edit" ? selected : null}
          existing={classes}
          onClose={() => setForm(null)}
          onSaved={setSelectedId}
        />
      )}

      {classes === null ? (
        <p className="mt-10 text-moss">Memuat kelas…</p>
      ) : classes.length === 0 ? (
        <div className="garis-buku mt-10 max-w-xl pb-3">
          <p>Belum ada kelas. Tambahkan kelas pertama Anda,</p>
          <p>lalu isi daftar siswanya.</p>
        </div>
      ) : (
        <div className="mt-8 xl:grid xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-10">
          {/* HP/tablet: tab mendatar di dalam wadah gulirnya sendiri. PC lebar: daftar tegak. */}
          <nav aria-label="Daftar kelas" className="mb-8 xl:mb-0">
            <ul className="flex gap-1 overflow-x-auto border-b-2 border-mist xl:block xl:space-y-1 xl:overflow-visible xl:border-b-0">
              {classes.map((c) => (
                <li key={c.id} className="shrink-0 xl:shrink">
                  <button
                    onClick={() => setSelectedId(c.id)}
                    aria-current={c.id === selectedId ? "true" : undefined}
                    className={`block w-full border-b-4 px-4 py-2.5 text-left xl:border-b-0 xl:border-l-4 ${
                      c.id === selectedId ? "border-chalk bg-mist font-semibold" : "border-transparent hover:bg-mist/60"
                    }`}
                  >
                    <span className="font-display text-lg">{c.name}</span>
                    <span className="hidden text-sm text-moss xl:block">Fase {c.fase}, {c.yearLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {selected && (
            <section aria-label={`Kelas ${selected.name}`} className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-extrabold">{selected.name}</h2>
                  <p className="text-moss">
                    Kelas {selected.grade}, Fase {selected.fase}, tahun ajaran {selected.yearLabel}
                    {students ? `, ${students.length} siswa` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setPanelOpen((v) => !v)} className="rounded-lg bg-chalk px-4 py-2.5 font-semibold text-ink hover:brightness-95 2xl:hidden">
                    {panelOpen ? "Tutup" : "Tambah siswa"}
                  </button>
                  <button onClick={() => setForm("edit")} className={btn}>Ubah kelas</button>
                  {confirmDelete ? (
                    <span className="flex items-center gap-3 text-sm">
                      Hapus {selected.name} beserta {students?.length ?? 0} siswanya?
                      <button onClick={removeClass} className="font-semibold text-red-800 underline">Ya, hapus</button>
                      <button onClick={() => setConfirmDelete(false)} className="underline">Batal</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="px-2 py-2.5 text-moss underline">Hapus kelas</button>
                  )}
                </div>
              </div>

              {/* Layar sangat lebar: daftar di kiri, panel tambah siswa tetap di kanan. */}
              <div className="mt-8 grid gap-8 2xl:grid-cols-[minmax(0,1fr)_28rem]">
                <StudentList ws={ws} students={students} onError={setError} />
                <div className={`order-first 2xl:order-none ${panelOpen ? "block" : "hidden"} 2xl:block`}>
                  <AddStudentsPanel
                    key={selected.id}
                    ws={ws}
                    classId={selected.id}
                    className={selected.name}
                    existing={students ?? []}
                    onDone={() => setPanelOpen(false)}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
