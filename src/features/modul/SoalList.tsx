import { btn, field } from "../../components/Fields";
import { SOAL_LABEL, emptySoal, type Soal, type SoalJenis } from "./model";

export default function SoalList({ label, soal, onChange, min = 1 }: { label: string; soal: Soal[]; onChange: (s: Soal[]) => void; min?: number }) {
  const set = (i: number, p: Partial<Soal>) => onChange(soal.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      <ol className="mt-2">
        {soal.map((s, i) => (
          <li key={i} className="border-b border-mist py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">{i + 1}.</span>
              <select aria-label={`Jenis soal ${i + 1}`} className={`${field} mt-0 w-auto`} value={s.jenis} onChange={(e) => set(i, { jenis: e.target.value as SoalJenis })}>
                {(Object.keys(SOAL_LABEL) as SoalJenis[]).map((j) => <option key={j} value={j}>{SOAL_LABEL[j]}</option>)}
              </select>
              {soal.length > min && <button onClick={() => onChange(soal.filter((_, j) => j !== i))} className="text-sm text-moss underline">Hapus</button>}
            </div>
            <textarea aria-label={`Teks soal ${i + 1}`} className={field} rows={2} value={s.teks} onChange={(e) => set(i, { teks: e.target.value })} placeholder="Teks soal untuk siswa" />
            {(s.jenis === "pg" || s.jenis === "cocok") && <textarea aria-label={`Pilihan soal ${i + 1}`} className={field} rows={3} value={s.opsi} onChange={(e) => set(i, { opsi: e.target.value })} placeholder="Satu pilihan per baris" />}
            <input aria-label={`Kunci soal ${i + 1}`} className={field} value={s.kunci} onChange={(e) => set(i, { kunci: e.target.value })} placeholder="Kunci atau pedoman jawaban (hanya untuk guru, tidak tampil ke siswa)" />
          </li>
        ))}
      </ol>
      <button onClick={() => onChange([...soal, emptySoal("isian")])} className={`${btn} mt-3`}>Tambah soal</button>
    </fieldset>
  );
}
