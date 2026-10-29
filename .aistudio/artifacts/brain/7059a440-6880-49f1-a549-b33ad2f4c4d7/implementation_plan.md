# ELEXA CAFE — Standalone Frontend Data Store & GitHub Pages Compatibility

Rencana integrasi data store lokal di sisi frontend untuk memastikan aplikasi POS, KDS, Table Management, dan Owner Dashboard berjalan 100% secara statis di GitHub Pages (`window.location.hostname.includes('github.io')`) tanpa ketergantungan pada server backend, dengan fallback otomatis dan initial seed eksplisit ke LocalStorage.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Pembaruan Arsitektur Terkonfirmasi:**
> 1. **Explicit LocalStorage Initial Seed**:
>    - Membuat modul sentral `src/services/storageService.ts` yang memeriksa `localStorage.getItem('products')`, `localStorage.getItem('categories')`, `localStorage.getItem('cafe_tables')`, dan `localStorage.getItem('orders')`.
>    - Jika bernilai `null`, `undefined`, string kosong, atau array kosong `[]`, sistem **seketika mengisinya secara eksplisit** dengan master data lengkap ELEXA CAFE.
> 2. **GitHub Pages Detection & Zero-Fetch Mode**:
>    - Pengecekan otomatis via helper `isStaticHost()`: mendeteksi `window.location.hostname.includes('github.io')` atau kegagalan fetch API backend.
>    - Jika berjalan di GitHub Pages, seluruh operasi (Get Products, Add to Cart, Checkout, Simpan Meja/Open Tab, Update Status KDS, Tambah/Edit Produk) langsung memutasi LocalStorage secara atomik tanpa memanggil `fetch('/api/*')`.
> 3. **Asset Image Bundling Kompatibel dengan Sub-Path (`/KASIR-CAFE/`)**:
>    - Mengimpor aset gambar lokal (`hero_iced_latte_*.jpg`, `artisan_croissant_*.jpg`, `matcha_cloud_drink_*.jpg`, `pottery_workshop_pass_*.jpg`) secara langsung di `mockData.ts` sehingga Vite membundel file gambar dan secara otomatis menyematkan prefix base path `/KASIR-CAFE/` tanpa resiko 404 di GitHub Pages.

---

### 1. Overview & Core Concept

Pengguna dapat menjalankan ELEXA CAFE dalam dua mode terpadu:
- **Mode Server Full-Stack** (Localhost / Cloud Run): Menggunakan Express REST API (`server.ts`) dengan atomic transaction mutex locking.
- **Mode Statis / Serverless** (GitHub Pages / Demo Offline): Menggunakan modul `storageService.ts` yang bertindak sebagai database lokal di browser. Data tersimpan persisten di `localStorage`, memungkinkan operasional kasir, meja, dapur KDS, dan analitik dashboard berjalan lancar tanpa server backend.

---

### 2. File Changes & Implementation Details

1. **`src/data/mockData.ts`**:
   - Master data lengkap dengan import gambar statis agar aman di-build oleh Vite:
     - Categories: Specialty Coffee, Artisanal Tea & Drinks, Pastry & Bakery, Workshop & Studio, Beans & Merchandise.
     - Products: 12 menu lengkap (Iced Spanish Latte, Artisan Almond Croissant, Ceremonial Matcha Cloud, Pottery Workshop, Espresso Romano, dll).
     - Cafe Tables: 9 meja (Indoor AC, Workshop Studio, Outdoor Terrace).
     - Initial Orders: Tiket KDS untuk demonstrasi alur barista.
     - Default Users: Owner, Kasir, Kitchen.
2. **`src/services/storageService.ts`**:
   - `isStaticHost()`: Cek apakah `window.location.hostname.includes('github.io')`.
   - `initializeStorage()`: Cek apakah data kosong; jika ya, tuliskan default mock data ke LocalStorage.
   - `getProducts()`, `saveProducts()`, `getCategories()`, `getTables()`, `saveTables()`, `getOrders()`, `saveOrders()`, `getAnalytics()`.
   - `processLocalCheckout()`: Eksekusi checkout atomik di browser (cek `stock >= qty`, kurangi stok produk di LocalStorage, simpan order baru, update status meja).
   - `updateLocalOrderStatus()`: Update tiket KDS di LocalStorage.
3. **Pembaruan Komponen**:
   - `src/components/pos/PosTerminal.tsx`: Pada `useEffect`, muat produk dan kategori melalui `storageService`. Jika di GitHub Pages, langsung ambil dari LocalStorage; jika ada server, coba fetch dan fallback ke LocalStorage jika gagal.
   - `src/components/kds/KitchenDisplaySystem.tsx`: Mendukung pembacaan dan update status tiket dari LocalStorage di GitHub Pages.
   - `src/components/tables/TableManagementView.tsx`: Mendukung pelunasan tab dan pembaruan meja di LocalStorage.
   - `src/components/dashboard/OwnerDashboard.tsx`: Mendukung CRUD produk, restock, dan grafik laba dari LocalStorage.
