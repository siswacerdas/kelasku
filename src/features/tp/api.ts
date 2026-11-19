import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { TpDoc, TpFields } from "./model";
import { emptyTp } from "./model";

const col = (ws: string) => collection(db, "workspaces", ws, "tp");

export function subscribeTp(ws: string, cb: (t: TpDoc[]) => void, onError: () => void) {
  return onSnapshot(
    col(ws),
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const x = d.data() as Partial<TpFields> & { status?: TpDoc["status"] };
          // Digabung dengan nilai kosong agar dokumen lama/sebagian tidak merusak tampilan (DATA-1)
          return { ...emptyTp(), ...x, uji: { ...emptyTp().uji, ...x.uji }, id: d.id, status: x.status ?? "draf" } as TpDoc;
        }),
      ),
    onError,
  );
}

const clean = (t: TpFields): TpFields => ({ ...t, tahapan: t.tahapan.map((s) => s.trim()).filter(Boolean), kko: t.kko.trim(), objek: t.objek.trim(), konten: t.konten.trim(), bukti: t.bukti.trim(), caraAsesmen: t.caraAsesmen.trim(), tidakDipakai: t.tidakDipakai.trim() });

export async function saveTp(ws: string, id: string | null, t: TpFields, status: TpDoc["status"]): Promise<string> {
  const data = { ...clean(t), status, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(doc(db, "workspaces", ws, "tp", id), data);
    return id;
  }
  return (await addDoc(col(ws), { ...data, createdAt: serverTimestamp() })).id;
}
export const deleteTp = (ws: string, id: string) => deleteDoc(doc(db, "workspaces", ws, "tp", id));
