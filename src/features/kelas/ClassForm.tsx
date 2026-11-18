import { useState } from "react";
import { addClass, updateClass } from "./api";
import type { ClassDoc } from "./types";
import { currentYearLabel, faseForGrade } from "./types";

const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";

export default function ClassForm({
  ws, initial, existing, onClose, onSaved,
}: {
  ws: string;
  initial: ClassDoc | null;
  existing: ClassDoc[];
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [grade, setGrade] = useState(initial?.grade ?? 1);
  const [yearLabel, setYearLabel] = useState(initial?.yearLabel ?? currentYearLabel());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError("Isi nama kelas, misalnya 5A.");
    if (!/^\d{4}\/\d{4}$/.test(yearLabel.trim())) return setError("Tulis tahun ajaran seperti 2026/2027.");
    if (existing.some((c) => c.id !== initial?.id && c.name.toLowerCase() === n.toLowerCase() && c.yearLabel === yearLabel.trim()))
      return setError(`Kelas ${n} untuk tahun ajaran ${yearLabel.trim()} sudah ada.`);
    setBusy(true);
    setError(null);
    try {
      const data = { name: n, grade, yearLabel: yearLabel.trim() };
      if (initial) {
        await updateClass(ws, initial.id, data);
        onSaved(initial.id);
      } else onSaved(await addClass(ws, data));
      onClose();
    } catch {
      setError("Kelas belum tersimpan. Periksa koneksi, lalu coba lagi.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 border-y-4 border-ink py-6">
      <h2 className="font-display text-xl font-semibold">{initial ? `Ubah kelas ${initial.name}` : "Tambah kelas"}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
        <label className="block">
          <span className="font-medium">Nama kelas</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="5A" maxLength={20} autoFocus />
        </label>
        <label className="block">
          <span className="font-medium">Tingkat</span>
          <select className={field} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>Kelas {g} (Fase {faseForGrade(g)})</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-medium">Tahun ajaran</span>
          <input className={field} value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} inputMode="numeric" />
        </label>
        <div className="flex gap-3">
          <button disabled={busy} className="rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-60">
            Simpan kelas
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist">
            Batal
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-800">{error}</p>}
    </form>
  );
}
