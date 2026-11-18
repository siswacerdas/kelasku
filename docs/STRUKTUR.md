# Struktur Kelasku (target awal: guru SD)

## Rute
```
/                      → diarahkan ke /app (landing publik menyusul)
/login
/app                   Beranda
/app/kelas             Kelas & siswa
/app/perencanaan/tujuan | rencana | modul
/app/asesmen
/app/nilai
/app/dokumen
/app/pengaturan
(kelak) /siswa/...     portal siswa untuk LMS
```

## Model data (Firestore)
Semua di bawah `workspaces/{ws}`; `ws` = uid guru untuk ruang kerja pribadi.
```
workspaces/{ws}            name, ownerId, plan, school{nama, alamat, kepalaSekolah}, activeYear{label, semester}
  members/{uid}            role: owner | teacher | student
  classes/{id}             name ("5A"), grade (5), fase ("C"), yearLabel
  students/{id}            classId, name, nis, nisn, gender (L/P)  ← data minimal; data anak dijaga ketat (DATA-3)
  subjects/{id}            name                          ← guru kelas SD: banyak mapel per kelas
  objectives/{id}          subjectId, grade, semester, text (tujuan pembelajaran)
  plans/{id}               classId, subjectId, objectiveIds[], isi rencana, status: draft | final
  modules/{id}             planId, isi modul
  assessments/{id}         moduleId, objectiveIds[], jenis, butir
  scores/{id}              assessmentId, studentId, objectiveId, nilai
```
Prinsip: dokumen menyimpan **ID rujukan** ke induknya, bukan salinan teks.
Setiap koleksi baru wajib masuk `firestore.rules` (RULES-2).

## Kekhasan guru SD
- Satu guru kelas mengajar banyak mata pelajaran pada satu rombel; mata pelajaran dipilih di dalam kelas, bukan sebaliknya.
- Fase dan kelas menentukan daftar tujuan pembelajaran yang ditawarkan.
- Data siswa adalah data anak: simpan seperlunya (nama, NIS), jangan menambah kolom pribadi tanpa alasan kuat.

## Jalur ke LMS
Kelas dan siswa yang sama dipakai LMS: siswa punya akun yang ditautkan ke `students/{id}`; modul "diterbitkan" ke kelas;
asesmen dikerjakan siswa dan hasilnya langsung masuk `scores`.
