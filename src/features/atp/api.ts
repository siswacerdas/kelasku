import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { AtpData } from "../tp/model";
import type { OrderUpdate } from "./model";

/** Menyimpan relasi satu TP. Hanya menyentuh bidang `atp`; bidang TP lain tidak tersentuh (DATA-1). */
export const saveAtp = (ws: string, id: string, atp: AtpData) => updateDoc(doc(db, "workspaces", ws, "tp", id), { atp });

/** Menerapkan urutan (dan pindah kelas) dalam satu batch agar kolom tidak setengah berubah. */
export async function applyOrder(ws: string, updates: OrderUpdate[]) {
  const b = writeBatch(db);
  for (const u of updates) {
    const data: Record<string, unknown> = { "atp.urutan": u.urutan };
    if (u.grade !== undefined) data.grade = u.grade;
    b.update(doc(db, "workspaces", ws, "tp", u.id), data);
  }
  await b.commit();
}
