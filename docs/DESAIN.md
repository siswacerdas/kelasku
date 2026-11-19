# Pedoman desain Kelasku

## Identitas: "buku kerja guru"
Bukan dasbor SaaS. Rujukannya adalah buku induk dan buku tulis: kepala halaman bergaris tebal, daftar berbaris, garis buku.
- Warna: `ink` #14302B (tinta/papan tulis), `paper` #F3F6F4, `moss` #3D6B5F, `chalk` #E8B730 (kapur; hanya untuk aksi utama dan penanda aktif), `mist` #D9E3DE.
- Huruf: Bricolage Grotesque (judul dan penanda), Public Sans (isi).
- Penanda khas: garis tebal di bawah `PageHeader`, motif `.garis-buku` untuk keadaan kosong dan daftar, sidebar `ink` dengan penanda aktif kuning di kiri.

## Larangan (tanda halaman generik)
- Deretan kartu identik dengan sudut bulat dan bayangan sama. Utamakan **baris, tabel, daftar bergaris, atau kolom**; kartu hanya bila isinya benar-benar objek yang berdiri sendiri.
- Gradasi dekoratif, ikon emoji, hero tengah dengan tiga fitur di bawahnya.
- Label huruf kapital berjarak di atas setiap judul; penomoran 01/02/03 untuk isi yang bukan urutan.
- Teks seperti "Welcome back" atau "Supercharge your workflow". Tulis dari sudut pandang guru: sebut pekerjaannya ("Susun rencana pembelajaran"), bukan fiturnya.

**Uji 5 detik**: tutup logo; apakah halaman masih terasa sebagai Kelasku? Bila tidak, rancang ulang.
**Wajib per halaman baru**: tulis satu kalimat "ide visual halaman" di entri changelog (apa yang membuat halaman ini bukan templat).

## Resep tata letak responsif
- **Kerangka**: semua halaman `/app/*` berada di `AppShell`; jangan membuat pembungkus lebar sendiri.
- **Lebar isi**: area kerja mengisi sisa layar sampai `110rem`. Jangan menaruh `max-w-3xl mx-auto` pada seluruh halaman.
- **Skala**: ukuran memakai rem; root font naik di ≥1920px (112,5%) dan ≥2560px (125%) sehingga PC beresolusi tinggi tidak terlihat kecil.
- **Layar lebar**: isi bertambah **kolom**, bukan teks yang memanjang. Pola: `grid xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]` (utama + panel samping). Daftar data: `grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr))`.
- **Teks bacaan**: dibatasi `max-w-[65ch]`; sisa lebar dipakai panel samping atau kolom ringkasan.
- **HP**: satu kolom, aksi utama di dasar layar atau di bawah judul, tabel lebar dibungkus `overflow-x-auto` di dalam wadahnya sendiri, ruang bawah `pb-28` karena menu bawah.
- **Tabel input nilai** (halaman paling padat): di PC tabel penuh dengan kepala tetap; di HP berubah menjadi daftar per siswa.
- **Halaman padat dengan rel samping** (mis. papan alur + telaah + rekap): kolom utama tetap penuh sampai `min-[110rem]` (1760 px), baru rel samping (28rem) muncul di kanan; di bawah itu rel berada di bawah papan. Jangan memakai `2xl` untuk memisahkan rel pada halaman yang memiliki dua kolom isi, karena kolom menyempit di 1536 px.
