import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { ClassDoc, Fase, StudentDoc } from "./types";
import { collator, faseForGrade } from "./types";
import type { StudentInput } from "./importParser";
import type { Profile } from "../profil/profile";

const col = (ws: string, name: string) => collection(db, "workspaces", ws, name);
const CHUNK = 400; // batas aman di bawah 500 operasi per batch

export function subscribeClasses(ws: string, cb: (c: ClassDoc[]) => void, onError: () => void) {
  return onSnapshot(
    col(ws, "classes"),
    (snap) =>
      cb(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ClassDoc, "id">) }))
          .sort((a, b) => collator.compare(a.name, b.name)),
      ),
    onError,
  );
}

export function subscribeStudents(ws: string, classId: string, cb: (s: StudentDoc[]) => void, onError: () => void) {
  return onSnapshot(
    query(col(ws, "students"), where("classId", "==", classId)),
    (snap) =>
      cb(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<StudentDoc, "id">) }))
          .sort((a, b) => collator.compare(a.name, b.name)),
      ),
    onError,
  );
}

export type ClassInput = { name: string; grade: number; yearLabel: string };
const classData = (c: ClassInput): Omit<ClassDoc, "id"> => ({
  name: c.name, grade: c.grade, fase: faseForGrade(c.grade) as Fase, yearLabel: c.yearLabel,
});

export async function addClass(ws: string, c: ClassInput): Promise<string> {
  const ref = await addDoc(col(ws, "classes"), { ...classData(c), createdAt: serverTimestamp() });
  return ref.id;
}
export const updateClass = (ws: string, id: string, c: ClassInput) =>
  updateDoc(doc(db, "workspaces", ws, "classes", id), classData(c));

/**
 * Menghapus kelas beserta siswanya.
 * DATA-2: saat plans/assessments/scores sudah ada, penghapusan harus memeriksa keterkaitan lebih dulu.
 */
export async function deleteClass(ws: string, classId: string) {
  const snap = await getDocs(query(col(ws, "students"), where("classId", "==", classId)));
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += CHUNK) {
    const b = writeBatch(db);
    refs.slice(i, i + CHUNK).forEach((r) => b.delete(r));
    await b.commit();
  }
  await deleteDoc(doc(db, "workspaces", ws, "classes", classId));
}

export async function addStudents(ws: string, classId: string, list: StudentInput[]) {
  for (let i = 0; i < list.length; i += CHUNK) {
    const b = writeBatch(db);
    list.slice(i, i + CHUNK).forEach((s) =>
      b.set(doc(col(ws, "students")), { classId, ...s, createdAt: serverTimestamp() }),
    );
    await b.commit();
  }
}
export const updateStudent = (ws: string, id: string, s: StudentInput) =>
  updateDoc(doc(db, "workspaces", ws, "students", id), { ...s });
export const deleteStudent = (ws: string, id: string) => deleteDoc(doc(db, "workspaces", ws, "students", id));

export const updateClassProfile = (ws: string, id: string, profile: Profile) =>
  updateDoc(doc(db, "workspaces", ws, "classes", id), { profile });
