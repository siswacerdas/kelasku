import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Profile } from "../profil/profile";

export type SchoolData = { name: string; address: string; city: string; principalName: string; principalId: string };
export type TeacherData = { name: string; id: string };
export type WorkspaceDoc = { name: string; plan: string; school?: Partial<SchoolData>; teacher?: Partial<TeacherData>; profile?: Profile };

export const emptySchool: SchoolData = { name: "", address: "", city: "", principalName: "", principalId: "" };
export const emptyTeacher: TeacherData = { name: "", id: "" };

export function subscribeWorkspace(ws: string, cb: (w: WorkspaceDoc) => void, onError: () => void) {
  return onSnapshot(doc(db, "workspaces", ws), (s) => s.exists() && cb(s.data() as WorkspaceDoc), onError);
}
/** Hanya bidang ini yang boleh diubah klien; plan dan ownerId dijaga rules (RULES-1). */
export const updateWorkspace = (ws: string, data: { school?: SchoolData; teacher?: TeacherData; profile?: Profile }) =>
  updateDoc(doc(db, "workspaces", ws), data);
