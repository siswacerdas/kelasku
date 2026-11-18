import { useState } from "react";
import { deleteStudent, updateStudent } from "./api";
import { checkStudent } from "./importParser";
import type { StudentDoc } from "./types";

const input = "w-full rounded-md border-2 border-mist bg-white px-2 py-2 focus:border-ink";
// Satu definisi kolom dipakai kepala dan baris agar selalu sejajar.
const cols = "md:grid-cols-[2.5rem_minmax(0,1fr)_8rem_9rem_4rem_11rem]";

export default function StudentList({ ws, students, onError }: { ws: string; students: StudentDoc[] | null; onError: (m: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", nis: "", nisn: "", gender: "" as "" | "L" | "P" });

  if (students === null) return <p className="text-moss">Memuat daftar siswa…</p>;
  if (students.length === 0)
    return (
      <div className="garis-buku max-w-xl pb-3">
        <p>Kelas ini belum punya siswa.</p>
        <p>Tambahkan lewat ketik, tempel dari Excel,</p>
        <p>atau unggah berkas template.</p>
      </div>
    );

  async function save(id: string) {
    const s = { ...draft, name: draft.name.replace(/\s+/g, " ").trim() };
    if (checkStudent(s).some((p) => p.level === "error")) return onError("Nama wajib diisi dan NIS maksimal 20 karakter.");
    try {
      await updateStudent(ws, id, s);
      setEditing(null);
    } catch {
      onError("Perubahan belum tersimpan. Coba lagi.");
    }
  }
  async function remove(id: string) {
    try {
      await deleteStudent(ws, id);
    } catch {
      onError("Siswa belum terhapus. Coba lagi.");
    }
    setConfirming(null);
  }

  return (
    <div>
      <div className={`hidden border-b-2 border-ink pb-2 text-sm font-semibold md:grid md:gap-x-4 ${cols}`}>
        <span>No</span><span>Nama</span><span>NIS</span><span>NISN</span><span>L/P</span><span />
      </div>
      <ol>
        {students.map((s, i) => (
          <li key={s.id} className={`grid gap-x-4 gap-y-1 border-b border-mist py-3 md:items-center ${cols}`}>
            <span className="text-moss md:text-ink">{i + 1}</span>
            {editing === s.id ? (
              <>
                <input aria-label="Nama" className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <input aria-label="NIS" className={input} value={draft.nis} onChange={(e) => setDraft({ ...draft, nis: e.target.value })} />
                <input aria-label="NISN" className={input} value={draft.nisn} onChange={(e) => setDraft({ ...draft, nisn: e.target.value })} />
                <select aria-label="Jenis kelamin" className={input} value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value as "" | "L" | "P" })}>
                  <option value="">-</option><option value="L">L</option><option value="P">P</option>
                </select>
                <span className="flex gap-3">
                  <button onClick={() => save(s.id)} className="font-semibold underline">Simpan</button>
                  <button onClick={() => setEditing(null)} className="text-moss underline">Batal</button>
                </span>
              </>
            ) : (
              <>
                <span className="min-w-0 font-medium">{s.name}</span>
                <span className="text-moss"><span className="md:hidden">NIS </span>{s.nis || "-"}</span>
                <span className="text-moss"><span className="md:hidden">NISN </span>{s.nisn || "-"}</span>
                <span className="text-moss">{s.gender || "-"}</span>
                <span className="flex gap-4 text-sm">
                  {confirming === s.id ? (
                    <>
                      <button onClick={() => remove(s.id)} className="font-semibold text-red-800 underline">Ya, hapus</button>
                      <button onClick={() => setConfirming(null)} className="text-moss underline">Batal</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setDraft({ name: s.name, nis: s.nis, nisn: s.nisn, gender: s.gender }); setEditing(s.id); }} className="underline">Ubah</button>
                      <button onClick={() => setConfirming(s.id)} className="text-moss underline">Hapus</button>
                    </>
                  )}
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
