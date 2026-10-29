# ELEXA CAFE — Point of Sale (POS), KDS & Business Management System

Sistem Point of Sale (POS) dan manajemen operasional terpadu untuk cafe & workshop **ELEXA CAFE** ("Cafe & Workshop", `www.elexacafe.id`). Dilengkapi sistem otentikasi Role-Based Access Control (RBAC) untuk 3 role (`owner`, `cashier`, `kitchen`), antarmuka kasir 16:9 split screen (65/35), simulasi otomatis QRIS Webhook, kapabilitas Offline-First dengan antrean sinkronisasi, Kitchen Display System (KDS) real-time untuk barista/dapur, Table Management (Open Tab & Pay First), serta backend Node.js / Express dengan atomic stock locking & database transactions.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Arsitektur & Spesifikasi Baru (Terkonfirmasi):**
> 1. **Perluasan Role RBAC**:
>    - `owner`: Akses penuh (Dashboard analitik, HPP/COGS, laba kotor, manajemen inventaris & kategori, manajemen staff, dan riwayat transaksi global).
>    - `cashier`: Terminal POS, pemilihan meja/open tab, sticky cart, kalkulasi kembalian, QRIS simulator, cetak struk, dan riwayat shift kasir.
>    - `kitchen`: Kitchen Display System (KDS) untuk barista & staf dapur (filter tiket: *Diproses* `#F59E0B` $\to$ *Siap Disajikan* `#3B82F6` $\to$ *Selesai* `#10B981`).
> 2. **Simulasi Otomatis QRIS Webhook**:
>    - Saat kasir memilih metode QRIS, modal menampilkan QR dinamis berstandar QRIS dengan nominal pesanan. Sistem secara otomatis menjalankan timer simulasi webhook (3–4 detik) yang mentrigger endpoint `/api/webhook/qris-callback`, mengubah status pembayaran menjadi `paid`, dan langsung menyelesaikan pesanan tanpa perlu konfirmasi kasir manual.
> 3. **Offline-First & PWA Sync Manager**:
>    - Menggunakan buffer LocalStorage terstruktur. Jika koneksi terputus (`navigator.onLine === false` atau server timeout), transaksi tetap berhasil dicatat dengan status `sync_status = 'pending_offline'`. Struk tetap dapat dicetak. Begitu koneksi online pulih, background sync manager otomatis mengirim transaksi pending ke Express API `/api/sync/offline-orders`.
> 4. **Table Management & Open Tab**:
>    - Pilihan area: *Indoor (AC)*, *Workshop Studio*, dan *Outdoor Terrace*.
>    - Mode pesanan: *Pay First* (langsung bayar saat pesan) dan *Open Tab / Pay Later* (pesanan masuk ke KDS, meja berstatus `occupied`, pembayaran ditagih belakangan saat pelanggan checkout).
> 5. **Atomic Stock Locking & Concurrency Guard**:
>    - Mutex transactional locking pada `POST /api/checkout`. Jika ada item dengan `stock < qty`, seluruh transaksi dibatalkan (Rollback) dan backend mengembalikan `HTTP 400 Bad Request` berisi daftar item yang kehabisan stok.

---

### 1. Overview & Core Concept

**ELEXA CAFE** adalah solusi POS terintegrasi yang menjembatani operasional kasir di bar depan, antrean pesanan di meja barista & dapur, serta kendali bisnis oleh pemilik kafe.

- **Terminal Kasir (Split Screen 16:9)**:
  - Sisi Kiri (65%): Tab kategori produk (*Specialty Coffee, Artisanal Tea, Pastry & Bites, Workshop Passes, Beans & Merch*), pencarian cepat barcode SKU / nama produk, filter ketersediaan stok, dan tombol cepat ganti meja.
  - Sisi Kanan (35%): Panel keranjang sticky dengan opsi tipe pesanan (*Dine-In* atau *Takeaway*), pemilihan nomor meja (*Table Picker*), list item dengan stepper jumlah `+` / `-`, catatan khusus (contoh: *"Oat milk, less sugar, hot"*), rincian Subtotal, PPN 10%, Diskon, dan Tombol *"BAYAR SEKARANG / OPEN TAB"* ($\ge 48\text{px}$).
- **Kitchen Display System (KDS)**:
  - Layar monitor khusus barista & dapur untuk melihat antrean pesanan real-time.
  - Tiket pesanan menampilkan nomor order, nomor meja / takeaway, waktu tunggu, list item beserta catatan kustom.
  - Tombol aksi transisi status: `Diproses` (Amber) $\to$ `Siap Disajikan` (Blue) $\to$ `Selesai` (Green).
- **Table Management (Denah Meja & Tab)**:
  - Tampilan visual meja per area (Indoor, Workshop, Outdoor) dengan indikator status: `Tersedia` (Abu-abu/Hijau), `Terisi / Open Tab` (Amber), `Reservasi` (Biru).
  - Kasir dapat memilih meja yang terisi untuk melihat rincian tagihan dan melakukan pelunasan (*Close Tab*).
- **Owner Dashboard & Inventaris**:
  - Ringkasan KPI: Omzet harian, laba kotor harian (Omzet minus HPP), total transaksi, dan rata-rata nilai keranjang (AOV).
  - Peringatan stok menipis (Low-stock threshold $\le 5$ unit).
  - CRUD Produk & Kategori dengan kalkulasi margin keuntungan.
  - Manajemen Akun Karyawan & Kasir.

---

### 2. User Experience & Visual Design

#### A. Layout Architecture & Navigasi
- **Top Bar Contract**:
  - Kiri: Wordmark `ELEXA CAFE` (subtext `Cafe & Workshop` di struk/hero).
  - Tengah: Navigasi cepat modul sesuai Role (`[Terminal Kasir]`, `[Meja & Tab]`, `[KDS Dapur]`, `[Dashboard Owner]`).
  - Kanan: Indikator koneksi (*Online / Offline Sync Buffer*), Role Badge (`Owner` / `Kasir` / `Kitchen`), Dark/Light mode toggle, dan Logout.
- **POS 16:9 Split Screen**:
  - Rasio 65% : 35% dengan kontainer berkelas `h-full overflow-hidden`.
  - Panel kiri memiliki scroll independen untuk katalog produk.
  - Panel kanan memiliki sticky header meja & customer, list item ber-scroll, dan sticky footer total & pembayaran.

#### B. Palet Warna & Desain Token (Adaptive Slate & Emerald)
- **Dark Mode (Default)**:
  - Canvas: `#0F172A` (Tailwind `slate-900`)
  - Surface Cards & Tables: `#1E293B` (`slate-800`) dengan hairline border `#334155` (`slate-700`)
  - Primary Accent (10%): Emerald `#10B981` (Hover: `#059669`) untuk tombol CTA *Bayar*, *Cetak Struk*, dan indikator sukses.
  - KDS Status Colors: Amber `#F59E0B` (Diproses), Sky/Blue `#3B82F6` (Siap Saji), Emerald `#10B981` (Selesai).
  - Danger / Void: Rose `#EF4444` untuk hapus baris item dan void transaksi.
  - Teks: High-contrast `#F8FAFC` untuk judul & nominal, `#94A3B8` untuk label sekunder.
- **Light Mode Toggle**:
  - Canvas: `#FAFAFA`
  - Cards: `#FFFFFF` dengan border `#E2E8F0`
  - Accent: Indigo `#6366F1` / Emerald `#059669`
- **Tipografi**:
  - Antarmuka & Judul: `Plus Jakarta Sans`
  - Angka Monospace Tabular: `font-mono tabular-nums` untuk seluruh nominal mata uang Rupiah (`Rp 38.000`) dan nomor order.
  - Touch Target: Seluruh tombol interaktif berukuran minimal $48\text{px} \times 48\text{px}$.

---

### 3. Key Product Decisions & Trade-Offs

1. **Simulasi Webhook QRIS**:
   - Alih-alih mengharuskan kasir menekan tombol "Cek Status" berkali-kali, begitu modal QRIS dibuka, polling simulator / SSE virtual secara otomatis memanggil Webhook callback backend setelah 3 detik. Modal berganti menjadi animasi centang sukses dan struk langsung disiapkan.
2. **Offline-First Buffer & Sync Queue**:
   - Jika endpoint Express tidak dapat dihubungi (simulasi offline mode via toggle atau koneksi mati), transaksi disimpan di `localStorage.getItem('elexa_offline_queue')`.
   - Transaksi diberi flag `sync_status: 'pending_offline'`. Nomor pesanan tetap dibuat unik (`OFF-XXXX`). Kasir dapat langsung mencetak struk fisik/preview.
   - Saat koneksi online kembali, Sync Manager secara otomatis melakukan `POST /api/sync/offline-orders` dalam satu batch transaction di backend.
3. **Table Management & Open Tab**:
   - Meja dapat disimpan dengan status pesanan `pending` (belum dibayar). Pesanan ini langsung muncul di layar KDS Dapur sehingga barista dapat mulai meracik minuman sementara pelanggan menikmati sesi workshop/meeting.
   - Saat pelanggan hendak pulang, kasir membuka meja tersebut di modul Meja, dan memproses pembayaran via modal pembayaran.
4. **Pencegahan Concurrency & Atomic Stock Locking**:
   - Backend memproses transaksi menggunakan locking mutex. Sebelum stok dikurangi, server memvalidasi `WHERE stock >= requested_qty`. Jika salah satu item gagal, seluruh mutasi transaksi dibatalkan (`ROLLBACK`), status transaksi ditolak dengan `400 Bad Request` dan mengembalikan payload:
     `{ error: "Stok tidak mencukupi", item: "Espresso Tonic", available: 1, requested: 2 }`.

---

### 4. Technical Architecture & Data Strategy

#### A. Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React SPA)                             │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │ POS Terminal (65/35)  │  │ Kitchen Display (KDS) │  │ Table Manager   │  │
│  │ - Catalog & Barcode   │  │ - Amber (Diproses)    │  │ - Open Tab      │  │
│  │ - Sticky Cart + Notes │  │ - Blue (Siap Saji)    │  │ - Pay First     │  │
│  │ - QRIS Auto-Webhook   │  │ - Green (Selesai)     │  │ - Floor Plan    │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬────────┘  │
│              │                          │                       │           │
│              ▼                          ▼                       ▼           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Offline Sync Manager (IndexedDB / LocalStorage Buffer)               │  │
│  │ Detects Online / Offline -> Queues offline orders -> Auto-Sync        │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ REST API (/api/*)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVER (Express.js)                        │
│                                                                             │
│  [Auth Middleware & RBAC Guard: Owner / Cashier / Kitchen]                  │
│  [Products & Category Controller]                                           │
│  [Checkout & Atomic Stock Locking Controller (Rollback on stock < qty)]    │
│  [Webhook QRIS Simulator: POST /api/webhook/qris-callback]                  │
│  [Table Management & Open Tab Controller]                                   │
│  [KDS Ticket Status Controller]                                             │
│  [Offline Batch Sync Controller: POST /api/sync/offline-orders]             │
│  [Relational In-Memory / File SQLite Database Store with Transactions]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### B. Skema Database Relasional (SQL DDL Definition)
```sql
-- 1. Users / Staff Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'cashier', 'kitchen')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(30)
);

-- 3. Products Table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(36) REFERENCES categories(id) ON DELETE RESTRICT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    price INTEGER NOT NULL,          -- Harga jual dalam Rupiah
    cost_price INTEGER NOT NULL,     -- HPP / Harga Pokok Penjualan (IDR)
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cafe Tables Table (Manajemen Meja & Area)
CREATE TABLE cafe_tables (
    id VARCHAR(36) PRIMARY KEY,
    table_number VARCHAR(20) UNIQUE NOT NULL,
    area VARCHAR(50) NOT NULL,      -- 'Indoor AC', 'Workshop Studio', 'Outdoor Terrace'
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved'))
);

-- 5. Orders / Transactions Table
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    table_id VARCHAR(36) REFERENCES cafe_tables(id) ON DELETE SET NULL,
    cashier_id VARCHAR(36) REFERENCES users(id),
    customer_name VARCHAR(100) DEFAULT 'Guest',
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')),
    subtotal INTEGER NOT NULL,
    tax_amount INTEGER NOT NULL,       -- PPN 10%
    discount_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'qris', 'card', 'unpaid')),
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    order_status VARCHAR(20) DEFAULT 'processing' CHECK (order_status IN ('processing', 'ready', 'completed', 'cancelled')),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_offline')),
    cash_tendered INTEGER,
    change_due INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Order Items Table
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(36) REFERENCES products(id),
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase INTEGER NOT NULL,
    cost_at_purchase INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    notes TEXT                        -- Contoh: "Less Ice", "Oatmilk", "Hot"
);
```

#### C. Detail Implementasi & Rencana File
1. **Server & Database Backend (`server.ts`)**:
   - Database store terstruktur dengan Foreign Keys, inisialisasi tabel, dan pre-seeded dummy data komprehensif (Menu kafe & workshop lengkap: Kopi, Artisan Pastry, Paket Workshop, Merchandise, Akun default untuk 3 role: `owner@elexacafe.id`, `kasir@elexacafe.id`, `kitchen@elexacafe.id`).
   - Transactional mutex lock untuk penanganan concurrency stok.
   - API endpoints:
     - Auth: `/api/auth/login`, `/api/auth/me`
     - Products & Categories: `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`, `GET /api/categories`
     - Tables & Open Tab: `GET /api/tables`, `POST /api/tables/:id/status`, `GET /api/tables/:id/active-order`
     - Checkout & Transactions: `POST /api/checkout` (dengan atomic stock verification & rollback)
     - Webhook QRIS: `POST /api/webhook/qris-callback` (simulasi gateway callback)
     - KDS: `GET /api/kds/orders`, `PATCH /api/kds/orders/:id/status`
     - Offline Sync: `POST /api/sync/offline-orders`
     - Analytics & Reports: `GET /api/analytics` (Omzet, COGS/HPP, Laba Bersih, Top Produk, Chart data per jam)
2. **Frontend Components**:
   - `src/types/pos.ts`: Antarmuka tipe data lengkap TypeScript.
   - `src/context/AuthContext.tsx`: RBAC session management, switch account demo instan.
   - `src/context/CartContext.tsx`: Cart state, item notes, table selection, dine-in / takeaway toggle, subtotal, tax 10%, diskon.
   - `src/context/OfflineSyncContext.tsx`: Network status monitoring, queueing offline transactions, auto-sync saat reconnect.
   - `src/components/common/Header.tsx`: 3-zone clean top bar, modul switcher berdasarkan Role, Dark/Light mode toggle, status koneksi offline/online indicator.
   - `src/components/pos/PosTerminal.tsx`: Terminal kasir split screen 65/35.
   - `src/components/pos/ProductCard.tsx`: Visual kartu produk elegan, gambar, badge stok, indikator kehabisan stok.
   - `src/components/pos/StickyCart.tsx`: Keranjang belanja sisi kanan, stepper `+` / `-`, input catatan item, rincian biaya, tombol bayar $\ge 48\text{px}$.
   - `src/components/pos/PaymentModal.tsx`: Pembayaran multi-metode (Cash dengan quick calculator, QRIS dengan auto-webhook simulator, Card EDC).
   - `src/components/pos/ReceiptModal.tsx`: Tampilan struk thermal 80mm ("ELEXA CAFE - Cafe & Workshop", detail kasir, meja, item, PPN 10%, footer `www.elexacafe.id`), tombol Print thermal CSS dan order baru.
   - `src/components/kds/KitchenDisplaySystem.tsx`: Antarmuka KDS Barista & Dapur dengan filter tab *Diproses* (Amber), *Siap Disajikan* (Blue), *Selesai* (Green), serta waktu tunggu tiket.
   - `src/components/tables/TableManagementView.tsx`: Denah visual meja per area, indikator Open Tab / occupied, dan modal rincian tagihan meja.
   - `src/components/dashboard/OwnerDashboard.tsx`: Analitik omzet, laba kotor, grafik tren penjualan, low-stock alerts, CRUD produk, dan daftar staff.
   - `src/components/auth/LoginView.tsx`: Form login elegan dengan 3 tombol instan akun Demo (Owner, Kasir, Kitchen).
