# ELEXA CAFE — Mobile-Responsive Layout & Touch Ergonomics

Rencana pembaruan antarmuka ELEXA CAFE agar sepenuhnya responsif, nyaman digunakan di layar smartphone (HP) dan tablet, serta mempertahankan estetika premium di layar desktop/POS terminal monitor.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Poin Perbaikan Responsivitas (Terkonfirmasi):**
> 1. **Meta Viewport Anti-Zoom**:
>    - Memperbarui `<meta name="viewport">` di `index.html` menjadi:
>      `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` untuk mencegah pergeseran viewport yang tidak disengaja saat mengetuk tombol atau input di perangkat seluler.
> 2. **Layout Responsif Terminal Kasir (`flex-col lg:flex-row`)**:
>    - **Desktop (`lg` ke atas)**: Tetap mempertahankan tampilan Split Screen 16:9 yang elegan (65% Katalog di sisi kiri, 35% Sticky Cart di sisi kanan).
>    - **Mobile & Tablet (`< lg`)**: Mengubah susunan menjadi satu kolom vertikal penuh (`w-full`). Katalog produk memiliki ruang penuh untuk dijelajahi.
> 3. **Grid Produk Adaptif**:
>    - Menggunakan kelas responsif: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4`.
> 4. **Floating Cart Bar & Mobile Drawer**:
>    - Di layar mobile (`lg:hidden`), saat keranjang terisi, tombol/bar melayang (**Floating Cart Bar**) akan muncul di bagian bawah layar menampilkan jumlah item dan total belanja.
>    - Mengetuk floating bar akan membuka keranjang pesanan dalam bentuk **Bottom Sheet / Slide Drawer** yang nyaman diakses dengan satu tangan, lengkap dengan tombol "Bayar Sekarang" $\ge 48\text{px}$.
> 5. **Eliminasi Scrolling Horizontal**:
>    - Menambahkan `overflow-x-hidden`, `w-full`, dan `max-w-full` pada kontainer root (`App.tsx`, `Header.tsx`, dan halaman utama).
>    - Menyesuaikan *Header* di mobile agar tombol navigasi modul dapat digeser secara horizontal (`overflow-x-auto`) atau menggunakan ikon ringkas tanpa memecah layout.

---

### 1. Overview & User Experience Flow

```
┌────────────────────────────────────────────────────────┐
│ MOBILE (HP) VIEWPORT (< 1024px)                        │
├────────────────────────────────────────────────────────┤
│ [TOP BAR: Elexa Cafe · Menu Icons · Dark/Light Toggle] │
├────────────────────────────────────────────────────────┤
│ [Search Bar & Barcode Input]                           │
│ [Scrollable Category Chips: All · Coffee · Pastry]     │
├────────────────────────────────────────────────────────┤
│ PRODUCT GRID (1 to 2 cols on mobile)                   │
│ ┌──────────────────────┐  ┌──────────────────────┐     │
│ │ Iced Spanish Latte   │  │ Almond Croissant     │     │
│ │ Rp 38.000       [ +] │  │ Rp 32.000       [ +] │     │
│ └──────────────────────┘  └──────────────────────┘     │
│ ┌──────────────────────┐  ┌──────────────────────┐     │
│ │ Matcha Cloud         │  │ Pottery Workshop     │     │
│ │ Rp 42.000       [ +] │  │ Rp 185.000      [ +] │     │
│ └──────────────────────┘  └──────────────────────┘     │
├────────────────────────────────────────────────────────┤
│ [FLOATING CART BAR: 3 Item · Rp 112.000 · [ Buka ] ]   │
└────────────────────────────────────────────────────────┘
```

---

### 2. File Changes & Implementation Details

1. **`index.html`**:
   - Ganti meta viewport ke:
     `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`
2. **`src/App.tsx`**:
   - Pastikan root container memiliki `w-full max-w-full overflow-x-hidden min-h-screen`.
3. **`src/components/common/Header.tsx`**:
   - Optimasi padding dan navigasi pada breakpoint mobile (`px-3 sm:px-5`).
   - Sediakan tombol tab yang ramah layar sentuh dan tidak menyebabkan overflow.
4. **`src/components/pos/PosTerminal.tsx`**:
   - Ubah pembungkus utama menjadi `flex-col lg:flex-row w-full max-w-full`.
   - Area katalog: `w-full lg:w-[65%]`.
   - Grid produk: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`.
   - Panel keranjang desktop: `hidden lg:flex lg:w-[35%]`.
   - Floating Cart Button & Modal Drawer untuk mobile (`lg:hidden`).
5. **`src/components/pos/ProductCard.tsx`**:
   - Optimasi layout card horizontal atau kompak pada mobile sangat sempit agar gambar dan teks proporsional.
