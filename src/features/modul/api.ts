import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { emptyModul, normalizeModul, toStoredModul, type ModulDoc, type ModulFields } from "./model";

export type ModulLibraryDoc = ModulFields & { id: string; status: "draf" | "terbit" };
const mine = (ws: string) => collection(db, "workspaces", ws, "modul");
const lib = () => collection(db, "modulLibrary");

export function subscribeModul(ws: string, cb: (r: ModulDoc[]) => void, onError: () => void) {
  return onSnapshot(mine(ws), (snap) => cb(snap.docs.map((d) => { const x = d.data(); return { ...normalizeModul(x as Partial<ModulFields>), id: d.id, status: (x.status as ModulDoc["status"]) ?? "draf", sumber: x.sumber }; })), onError);
}
export async function saveModul(ws: string, id: string | null, f: ModulFields, status: ModulDoc["status"], sumber?: ModulDoc["sumber"]): Promise<string> {
  const data = { ...toStoredModul(f), status, ...(sumber ? { sumber } : {}), updatedAt: serverTimestamp() };
  if (id) { await updateDoc(doc(db, "workspaces", ws, "modul", id), data); return id; }
  return (await addDoc(mine(ws), { ...data, createdAt: serverTimestamp() })).id;
}
export const deleteModul = (ws: string, id: string) => deleteDoc(doc(db, "workspaces", ws, "modul", id));

/** Guru: hanya yang terbit (aturan Firestore mensyaratkan filter ini). Admin: semuanya. */
export function subscribeModulLibrary(isAdmin: boolean, cb: (r: ModulLibraryDoc[]) => void, onError: () => void) {
  const q = isAdmin ? lib() : query(lib(), where("status", "==", "terbit"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => { const x = d.data(); return { ...normalizeModul(x as Partial<ModulFields>), id: d.id, status: (x.status as ModulLibraryDoc["status"]) ?? "draf" }; })), onError);
}
export async function saveModulLibrary(id: string | null, f: ModulFields, status: ModulLibraryDoc["status"], uid: string): Promise<string> {
  const data = { ...toStoredModul({ ...f, tpId: "" }), status, updatedBy: uid, updatedAt: serverTimestamp() };
  // merge: metadata lain (mis. asal AI kelak) tidak hilang saat admin mengedit
  if (id) { await setDoc(doc(db, "modulLibrary", id), data, { merge: true }); return id; }
  return (await addDoc(lib(), { ...data, createdAt: serverTimestamp() })).id;
}
export const deleteModulLibrary = (id: string) => deleteDoc(doc(db, "modulLibrary", id));

/** Guru memakai modul pustaka: disalin ke ruang kerjanya sebagai draf, konfirmasi dikosongkan, dan menjadi miliknya untuk diubah. */
export const copyModulFromLibrary = (ws: string, item: ModulLibraryDoc) =>
  saveModul(ws, null, { ...toStoredModul(item), tpId: "", pintuMasuk: emptyModul().pintuMasuk }, "draf", { libraryId: item.id });
