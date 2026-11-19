import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { normalizeScaffold, scaffoldId, toStoredScaffold, type ScaffoldDoc, type ScaffoldFields } from "./model";

const col = (ws: string) => collection(db, "workspaces", ws, "scaffolds");

export function subscribeScaffolds(ws: string, cb: (s: ScaffoldDoc[]) => void, onError: () => void) {
  return onSnapshot(
    col(ws),
    (snap) => cb(snap.docs.map((d) => ({ ...normalizeScaffold(d.data() as Partial<ScaffoldFields>), id: d.id, status: (d.data().status as ScaffoldDoc["status"]) ?? "draf" }))),
    onError,
  );
}

/** Satu dokumen per pasangan TP dan rombel (id deterministik), sehingga tidak ada duplikat. */
export const saveScaffold = (ws: string, s: ScaffoldFields, status: ScaffoldDoc["status"]) =>
  setDoc(doc(db, "workspaces", ws, "scaffolds", scaffoldId(s.tpId, s.classId)), { ...toStoredScaffold(s), status, updatedAt: serverTimestamp() });

export const deleteScaffold = (ws: string, tpId: string, classId: string) => deleteDoc(doc(db, "workspaces", ws, "scaffolds", scaffoldId(tpId, classId)));
