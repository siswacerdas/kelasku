import type { ReactNode } from "react";

export const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
export const btn = "rounded-lg border-2 border-ink px-4 py-2 font-semibold hover:bg-mist";

export function Txt({ label, value, onChange, rows = 3, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-sm text-moss">{hint}</span>}
      <textarea className={field} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Seg<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, text]) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} className="peer sr-only" checked={value === v} onChange={() => onChange(v)} />
          <span className="block rounded-md border-2 border-mist px-3 py-2 peer-checked:border-ink peer-checked:bg-mist peer-checked:font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-chalk">{text}</span>
        </label>
      ))}
    </div>
  );
}

/** Daftar teks yang dapat ditambah dan dihapus (pertanyaan, paragraf, langkah). */
export function StringList({ label, hint, items, onChange, rows = 2, addLabel = "Tambah", min = 1 }: { label: string; hint?: string; items: string[]; onChange: (v: string[]) => void; rows?: number; addLabel?: string; min?: number }): ReactNode {
  return (
    <fieldset>
      <legend className="font-medium">{label}</legend>
      {hint && <p className="text-sm text-moss">{hint}</p>}
      <ol className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2.5 w-6 shrink-0 text-right font-semibold">{i + 1}</span>
            <textarea aria-label={`${label} ${i + 1}`} className={`${field} mt-0`} rows={rows} value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            {items.length > min && <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-moss underline">Hapus</button>}
          </li>
        ))}
      </ol>
      <button onClick={() => onChange([...items, ""])} className={`${btn} mt-2`}>{addLabel}</button>
    </fieldset>
  );
}
