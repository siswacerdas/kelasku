import { useRef, useState } from "react";
import { addStudents } from "./api";
import { buildTemplateBuffer, readStudentRows } from "./excel";
import { checkStudent, markAgainstExisting, parseGrid, parseText, type ParseResult, type StudentInput } from "./importParser";
import type { StudentDoc } from "./types";

type Mode = "ketik" | "tempel" | "file";
const MAX_FILE = 2 * 1024 * 1024;
const field = "mt-1 block w-full rounded-md border-2 border-mist bg-white px-3 py-2.5 focus:border-ink";
const primary = "rounded-lg bg-chalk px-5 py-3 font-semibold text-ink hover:brightness-95 disabled:opacity-60";
const secondary = "rounded-lg border-2 border-ink px-5 py-3 font-semibold hover:bg-mist";

export default function AddStudentsPanel({
  ws, classId, className, existing, onDone,
}: {
  ws: string;
  classId: string;
  className: string;
  existing: StudentDoc[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>("ketik");
  const [one, setOne] = useState<StudentInput>({ name: "", nis: "", nisn: "", gender: "" });
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const reset = () => { setPreview(null); setMessage(null); };
  const switchMode = (m: Mode) => { setMode(m); reset(); };
  const show = (r: ParseResult) => {
    const rows = markAgainstExisting(r.rows, existing);
    if (rows.length === 0) return setMessage("Tidak ada nama siswa yang terbaca. Periksa isinya, lalu coba lagi.");
    setMessage(null);
    setPreview({ ...r, rows });
  };

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    const s = { ...one, name: one.name.replace(/\s+/g, " ").trim() };
    const [row] = markAgainstExisting([{ line: 1, student: s, problems: checkStudent(s), skip: false }], existing);
    const err = row.problems.find((p) => p.level === "error");
    if (err) return setMessage(err.text + ".");
    setBusy(true);
    try {
      await addStudents(ws, classId, [s]);
      setOne({ name: "", nis: "", nisn: "", gender: "" });
      setMessage(`${s.name} ditambahkan.`);
      nameRef.current?.focus();
    } catch {
      setMessage("Siswa belum tersimpan. Periksa koneksi, lalu coba lagi.");
    }
    setBusy(false);
  }

  async function downloadTemplate() {
    setBusy(true);
    try {
      const data = await buildTemplateBuffer();
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-daftar-siswa.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Template belum dapat dibuat. Muat ulang halaman, lalu coba lagi.");
    }
    setBusy(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    reset();
    const lower = f.name.toLowerCase();
    if (f.size > MAX_FILE) return setMessage("Berkas terlalu besar (maksimal 2 MB).");
    setBusy(true);
    try {
      if (lower.endsWith(".xlsx")) show(parseGrid(await readStudentRows(await f.arrayBuffer())));
      else if (lower.endsWith(".csv") || lower.endsWith(".txt")) show(parseText(await f.text()));
      else setMessage("Gunakan berkas .xlsx atau .csv. Berkas .xls lama: buka di Excel lalu Simpan sebagai .xlsx.");
    } catch {
      setMessage("Berkas tidak dapat dibaca. Pastikan itu berkas .xlsx yang tidak rusak.");
    }
    setBusy(false);
  }

  async function confirm() {
    if (!preview) return;
    const ok = preview.rows.filter((r) => !r.skip).map((r) => r.student);
    setBusy(true);
    try {
      await addStudents(ws, classId, ok);
      setText("");
      reset();
      onDone();
    } catch {
      setMessage("Siswa belum tersimpan. Periksa koneksi, lalu coba lagi.");
    }
    setBusy(false);
  }

  const okCount = preview?.rows.filter((r) => !r.skip).length ?? 0;
  const skipCount = (preview?.rows.length ?? 0) - okCount;
  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => switchMode(m)}
      aria-pressed={mode === m}
      className={`border-b-4 px-3 py-2 ${mode === m ? "border-chalk font-semibold" : "border-transparent text-moss"}`}
    >
      {label}
    </button>
  );

  return (
    <section aria-label={`Tambah siswa ke kelas ${className}`} className="border-y-4 border-ink py-5 2xl:border-y-0 2xl:border-l-4 2xl:py-0 2xl:pl-8">
      <h3 className="font-display text-xl font-semibold">Tambah siswa ke {className}</h3>
      <div className="mt-3 flex flex-wrap gap-1 border-b border-mist">
        {tab("ketik", "Ketik")}{tab("tempel", "Tempel dari Excel")}{tab("file", "Berkas Excel")}
      </div>

      {preview ? (
        <div className="mt-4">
          <p className="font-semibold">
            {okCount} siswa siap ditambahkan{skipCount > 0 ? `, ${skipCount} dilewati` : ""}.
          </p>
          {!preview.usedHeader && <p className="mt-1 text-sm text-moss">Judul kolom tidak ditemukan, urutan Nama, NIS, NISN, L/P dipakai.</p>}
          {preview.tooMany && <p role="alert" className="mt-1 text-sm font-medium text-red-800">Hanya 300 baris pertama yang dibaca. Pecah daftar menjadi beberapa impor.</p>}
          <ol className="mt-3 max-h-80 overflow-y-auto border-y border-mist">
            {preview.rows.map((r) => (
              <li key={r.line} className={`border-b border-mist px-1 py-2 text-sm ${r.skip ? "bg-red-50" : ""}`}>
                <span className="font-medium">{r.student.name || "(tanpa nama)"}</span>
                <span className="text-moss">{r.student.nis ? `, NIS ${r.student.nis}` : ""}{r.student.gender ? `, ${r.student.gender}` : ""}</span>
                {r.problems.map((p) => (
                  <p key={p.text} className={p.level === "error" ? "font-medium text-red-800" : "text-moss"}>
                    {p.level === "error" ? "Dilewati: " : "Catatan: "}{p.text} (baris {r.line})
                  </p>
                ))}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={confirm} disabled={busy || okCount === 0 || preview.tooMany} className={primary}>
              Tambahkan {okCount} siswa
            </button>
            <button onClick={reset} className={secondary}>Periksa ulang</button>
          </div>
        </div>
      ) : mode === "ketik" ? (
        <form onSubmit={addOne} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="font-medium">Nama</span>
            <input ref={nameRef} className={field} value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} maxLength={100} />
          </label>
          <label className="block"><span className="font-medium">NIS</span>
            <input className={field} value={one.nis} onChange={(e) => setOne({ ...one, nis: e.target.value })} inputMode="numeric" maxLength={20} /></label>
          <label className="block"><span className="font-medium">NISN</span>
            <input className={field} value={one.nisn} onChange={(e) => setOne({ ...one, nisn: e.target.value })} inputMode="numeric" maxLength={10} /></label>
          <label className="block"><span className="font-medium">Jenis kelamin</span>
            <select className={field} value={one.gender} onChange={(e) => setOne({ ...one, gender: e.target.value as StudentInput["gender"] })}>
              <option value="">Belum diisi</option><option value="L">Laki-laki</option><option value="P">Perempuan</option>
            </select></label>
          <div className="flex items-end"><button disabled={busy} className={primary}>Tambah siswa</button></div>
        </form>
      ) : mode === "tempel" ? (
        <div className="mt-4">
          <p className="text-moss">Salin kolom dari Excel lalu tempel di sini. Boleh hanya nama (satu per baris), atau dengan kolom Nama, NIS, NISN, Jenis Kelamin.</p>
          <textarea className={`${field} h-48 font-mono text-sm`} value={text} onChange={(e) => setText(e.target.value)} aria-label="Tempel daftar siswa" />
          <button onClick={() => (reset(), show(parseText(text)))} disabled={!text.trim()} className={`${primary} mt-3`}>Periksa daftar</button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-moss">Unduh template, isi daftar siswa, lalu unggah kembali. Urutan kolom boleh diubah dan kolom selain Nama boleh dihapus.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button onClick={downloadTemplate} disabled={busy} className={secondary}>Unduh template</button>
            <label className={`${primary} cursor-pointer`}>
              Pilih berkas
              <input type="file" accept=".xlsx,.csv,.txt" onChange={onFile} className="sr-only" />
            </label>
          </div>
        </div>
      )}
      {message && <p role="status" className="mt-3 text-sm font-medium">{message}</p>}
    </section>
  );
}
