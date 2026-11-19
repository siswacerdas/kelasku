import { useState } from "react";
import ProfileQuestions from "./ProfileQuestions";
import { CLASS_KEYS, countAnswered, type Choice, type ProfileKey } from "./profile";
import { updateClassProfile } from "../kelas/api";
import type { ClassDoc } from "../kelas/types";

export default function ClassProfile({ ws, cls }: { ws: string; cls: ClassDoc }) {
  const [status, setStatus] = useState<string | null>(null);
  async function change(k: ProfileKey, c: Choice) {
    try {
      await updateClassProfile(ws, cls.id, { ...cls.profile, [k]: c });
      setStatus("Tersimpan.");
    } catch {
      setStatus("Belum tersimpan. Periksa koneksi, lalu coba lagi.");
    }
  }
  return (
    <details className="mt-6 border-y-2 border-mist py-3">
      <summary className="cursor-pointer font-display text-lg font-semibold">
        Profil kelas untuk perencanaan{" "}
        <span className="font-sans text-base font-normal text-moss">({countAnswered(CLASS_KEYS, cls.profile)} dari {CLASS_KEYS.length} terjawab)</span>
      </summary>
      <p className="mt-3 max-w-[65ch] text-moss">Jawaban ini menentukan cara tangga pembelajaran disusun untuk kelas {cls.name}. Yang belum Anda ketahui cukup dijawab "Tidak tahu"; sistem memakai asumsi aman dan menandainya.</p>
      <ProfileQuestions keys={CLASS_KEYS} value={cls.profile} onChange={change} />
      {status && <p role="status" className="text-sm font-medium">{status}</p>}
    </details>
  );
}
