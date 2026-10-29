# ELEXA CAFE — Non-Overlapping Header & Search Flow Layout (COMPLETED)

Rencana penataan ulang tata letak vertikal untuk Navbar, Banner "Ganti Akun Demo", dan Kartu Pencarian agar tersusun secara runtut dari atas ke bawah menggunakan alur Flexbox normal tanpa ada elemen yang saling menumpuk (overlapping) — telah selesai diimplementasikan dan diverifikasi 100%.

---

### Status: Selesai Diimplementasikan & Lolos Verifikasi Build

### User Review & Critical Decisions

> [!IMPORTANT]
> **Struktur Tata Letak Vertikal Runtut (Terkonfirmasi):**
> 1. **Urutan Elemen Alur Dokumen (Top to Bottom)**:
>    - **Baris 1**: **Navbar Utama** (Logo Elexa Cafe, navigasi modul [Terminal Kasir, Meja & Open Tab, KDS Dapur, Owner Dashboard], status Online/Offline, Toggle Tema, dan Logout).
>    - **Baris 2**: **Banner Akun Demo (In-Flow Banner)**: Ditempatkan tepat di bawah Navbar sebagai baris horizontal/fleksibel permanen dalam alur dokumen (`flex flex-wrap items-center`), bukan dropdown melayang (`position: absolute`) yang rawan tertimpa atau menutupi konten lain. Menampilkan switcher cepat: *Owner (Akses Penuh)*, *Kasir (Terminal POS)*, *Barista & Dapur (KDS)*, serta tombol *Reset Data Default*.
>    - **Baris 3**: **Kartu Pencarian & Kategori**: Terletak tepat di bawah Banner Demo dengan margin/gap positif standar. Berisi input pencarian menu/SKU, tombol filter stok, dan pilihan kategori menu.
>    - **Baris 4**: **Grid Produk**: Mengalir ke bawah dengan scroll vertikal mandiri.
> 2. **Eliminasi Position Conflict**:
>    - Menghilangkan dropdown `position: absolute` pada selector demo account di header yang sebelumnya memicu tabrakan visual.
>    - Memastikan seluruh kontainer menggunakan `position: relative` atau alur statis standar dengan margin positif dan `w-full max-w-full`.

---

### 1. Visual Hierarchy & Spacing Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. NAVBAR UTAMA (h-16, w-full, border-b)                               │
│ [Logo ELEXA CAFE] · [Nav Modul: Kasir/Meja/KDS] · [Wifi] · [Theme/Out] │
├────────────────────────────────────────────────────────────────────────┤
│ 2. BANNER AKUN DEMO (In-Flow Baris Vertikal)                           │
│ "Akun Demo: [Owner / Founder]  [Kasir Utama]  [Barista KDS]  [Reset]"  │
├────────────────────────────────────────────────────────────────────────┤
│ 3. KARTU PENCARIAN & KATEGORI                                          │
│ [Input: Cari menu kafe atau scan barcode SKU...] [Hanya Stok Tersedia] │
│ [Tab Kategori: Semua Menu · Coffee · Tea · Pastry · Workshop · Merch]  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. KATALOG GRID PRODUK (Scrollable, 1-4 Kolom Responsif)               │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│ │ Spanish Latte│  │ Croissant    │  │ Matcha Cloud │                   │
│ └──────────────┘  └──────────────┘  └──────────────┘                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Implementation Steps

1. **`src/components/common/Header.tsx`**:
   - Jadikan Top Bar bersih dan fokus pada identitas brand, status koneksi, navigasi modul, dan aksi global.
   - Sediakan komponen baris Banner Demo terpisah atau terintegrasi di bagian bawah Navbar dalam alur normal (`w-full border-b border-slate-800 bg-slate-900/90 py-2 px-4`).
2. **`src/components/pos/PosTerminal.tsx`**:
   - Hapus segala penggunaan positioning absolut atau margin negatif pada kartu pencarian.
   - Atur kartu pencarian dan tab kategori sebagai blok flex-col dengan padding dan border yang rapi.
3. **Verifikasi Tampilan Responsif**:
   - Pastikan di layar smartphone (HP), banner akun demo dapat di-scroll secara horizontal tanpa memotong teks, dan kartu pencarian berada tepat di bawahnya dengan rapi.
