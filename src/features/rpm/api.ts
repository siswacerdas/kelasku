import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { emptyRpm, normalizeRpm, toStoredRpm, type RpmDoc, type RpmFields } from "./model";

export type LibraryDoc = RpmFields & { id: string; status: "draf" | "terbit"; judul: string };
const mine = (ws: string) => collection(db, "workspaces", ws, "rpm");
const lib = () => collection(db, "rpmLibrary");

export function subscribeRpm(ws: string, cb: (r: RpmDoc[]) => void, onError: () => void) {
  return onSnapshot(
    mine(ws),
    (snap) => cb(snap.docs.map((d) => { const x = d.data(); return { ...normalizeRpm(x as Partial<RpmFields>), id: d.id, status: (x.status as RpmDoc["status"]) ?? "draf", sumber: x.sumber }; })),
    onError,
  );
}
export async function saveRpm(ws: string, id: string | null, f: RpmFields, status: RpmDoc["status"], sumber?: RpmDoc["sumber"]): Promise<string> {
  const data = { ...toStoredRpm(f), status, ...(sumber ? { sumber } : {}), updatedAt: serverTimestamp() };
  if (id) { await updateDoc(doc(db, "workspaces", ws, "rpm", id), data); return id; }
  return (await addDoc(mine(ws), { ...data, createdAt: serverTimestamp() })).id;
}
export const deleteRpm = (ws: string, id: string) => deleteDoc(doc(db, "workspaces", ws, "rpm", id));

/** Guru: hanya yang terbit (aturan Firestore mensyaratkan filter ini). Admin: semuanya. */
export function subscribeLibrary(isAdmin: boolean, cb: (r: LibraryDoc[]) => void, onError: () => void) {
  const q = isAdmin ? lib() : query(lib(), where("status", "==", "terbit"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => { const x = d.data(); return { ...normalizeRpm(x as Partial<RpmFields>), id: d.id, status: (x.status as LibraryDoc["status"]) ?? "draf", judul: String(x.judul ?? "") }; })), onError);
}
export async function saveLibrary(id: string | null, f: RpmFields, status: LibraryDoc["status"], judul: string, uid: string): Promise<string> {
  const data = { ...toStoredRpm({ ...f, tpId: "" }), status, judul, updatedBy: uid, updatedAt: serverTimestamp() };
  // merge: metadata asal AI (ai, createdBy) tidak hilang saat admin mengedit
  if (id) { await setDoc(doc(db, "rpmLibrary", id), data, { merge: true }); return id; }
  return (await addDoc(lib(), { ...data, createdAt: serverTimestamp() })).id;
}
export const deleteLibrary = (id: string) => deleteDoc(doc(db, "rpmLibrary", id));

/** Guru memakai RPM pustaka: disalin ke ruang kerjanya sebagai draf, audit mandiri direset, dan menjadi miliknya untuk diubah. */
export const copyFromLibrary = (ws: string, item: LibraryDoc) =>
  saveRpm(ws, null, { ...toStoredRpm(item), tpId: "", konfirmasi: emptyRpm().konfirmasi }, "draf", { libraryId: item.id });
