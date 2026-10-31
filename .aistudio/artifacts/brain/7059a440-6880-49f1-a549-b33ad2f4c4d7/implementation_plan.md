# Implementasi Filter Periode Waktu pada Owner Dashboard (Elexa Cafe)

Rencana penambahan kendali filter periode waktu (**Hari Ini**, **1 Minggu**, **1 Bulan**, **Semua**) pada antarmuka Owner Dashboard Elexa Cafe untuk menyaring data Riwayat Transaksi dan menghitung ulang kartu KPI analitik finansial secara dinamis dan responsif di layar mobile.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan desain berikut telah dikonfirmasi pada tahap tanya-jawab:
> - **Gaya Tampilan Filter**: Tombol segmen horizontal dengan scroll halus (`overflow-x-auto no-scrollbar whitespace-nowrap gap-1.5`) di bawah navigasi tab atau di header section dashboard.
> - **Cakupan Efek Filter**: Filter periode waktu akan memperbarui kartu KPI statistik atas (Total Omzet, Laba Kotor, Modal HPP, Rata-rata Keranjang/AOV, dan Jumlah Transaksi) serta menyaring daftar baris pada tabel **Riwayat Transaksi**.

---

## 1. Overview & Core Concept

- **Apa yang Dikerjakan**:
  1. **Komponen Pemilih Periode Waktu**: Tombol segmen horizontal 4 opsi:
     - `today`: "Hari Ini" (Default)
     - `week`: "1 Minggu" (7 Hari Terakhir)
     - `month`: "1 Bulan" (30 Hari Terakhir)
     - `all`: "Semua" (Seluruh Riwayat Transaksi)
  2. **Data Multi-Hari yang Kaya**: Menambahkan transaksi historis realistis (kemarin, 3 hari lalu, 5 hari lalu, 12 hari lalu, 20 hari lalu) di `INITIAL_ORDERS` agar ketika owner memilih "1 Minggu", "1 Bulan", atau "Semua", tabel riwayat dan metrik keuangan menampilkan kenaikan angka yang nyata dan akurat.
  3. **Penghitungan Metrik Dinamis**:
     - Menghitung omzet, laba kotor, HPP, jumlah pesanan, dan AOV sesuai rentang tanggal yang aktif.
     - Menyaring tabel riwayat transaksi secara real-time.
  4. **Antarmuka Mobile-First**:
     - Menggunakan kontainer `overflow-x-auto no-scrollbar whitespace-nowrap` yang mulus di HP tanpa memakan ruang vertikal berlebih.
     - Penanda visual aktif dengan latar belakang emerald kontras tinggi dan teks tebal.

---

## 2. User Experience & Visual Design

### Alur Tampilan Pengguna:
1. **Header & Sub-Bar Filter**:
   - Di bawah header dashboard, terdapat bar horizontal filter periode dengan ikon kalender/waktu dan 4 tombol segmen:
     * `[ Hari Ini ]` (Aktif secara default)
     * `[ 1 Minggu ]` (7 Hari)
     * `[ 1 Bulan ]` (30 Hari)
     * `[ Semua ]` (Audit Penuh)
2. **Reaktivitas Instan**:
   - Saat owner mengetuk "1 Minggu":
     * Kartu Omzet berubah merefleksikan omzet 7 hari terakhir (misal: Rp 3.250.000).
     * Kartu Laba Kotor & HPP ikut terhitung ulang secara proporsional.
     * Tabel Riwayat Transaksi langsung menampilkan transaksi dari rentang 7 hari terakhir.
     * Teks deskripsi kartu KPI menyesuaikan (misal: *"Akumulasi 7 hari terakhir"*).
3. **Responsivitas HP**:
   - Bar filter dapat digeser ke samping dengan sentuhan jari tanpa memicu overflow halaman utama.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Penghitungan Client-Side Instan & Sinkronisasi API**:
  - *Pendekatan*: Menghitung filter periode waktu langsung dari array pesanan (`orders`) di state React dengan fungsi pembantu waktu `isWithinPeriod(orderDate, period)`.
  - *Alasan*: Memberikan respons instan tanpa delay jaringan (0ms latency), bekerja 100% sempurna baik di localhost Express maupun saat dijalankan statis di GitHub Pages.
- **Keputusan 2: Penambahan Mock Transaksi Multi-Hari**:
  - *Pendekatan*: Melengkapi `INITIAL_ORDERS` dengan transaksi bervariasi rentang 1 s.d. 25 hari lalu.
  - *Alasan*: Mencegah tampilan kosong saat owner mengganti filter ke "1 Minggu" atau "1 Bulan", memberikan demonstrasi analitik kafe yang hidup dan profesional.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   OwnerDashboard                       │
│  State: activePeriod ('today' | 'week' | 'month' | 'all')│
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Period Segment Bar        │   │    Filtered Metrics Engine    │
│  [Hari Ini] [1 Minggu]        │   │ - Filter orders by created_at │
│  [1 Bulan]  [Semua]           │   │ - Recompute Omzet, GP, AOV    │
└───────────────────────────────┘   └───────────────┬───────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────┐
                 ▼                                                     ▼
┌───────────────────────────────────┐               ┌───────────────────────────────────┐
│           KPI Cards               │               │        Riwayat Transaksi          │
│ - Omzet Periode Terpilih          │               │ - Filtered orders table           │
│ - Laba Kotor & Modal HPP          │               │ - Compact horizontal scroll       │
│ - AOV & Count Transaksi           │               │ - Detail modal struk tetap aktif  │
└───────────────────────────────────┘               └───────────────────────────────────┘
```

### Rincian Perubahan File:
1. `src/data/mockData.ts`:
   - Tambahkan transaksi historis (2 hari lalu, 5 hari lalu, 12 hari lalu, 22 hari lalu) dengan item menu, metode bayar (QRIS, Tunai, Kartu), dan nominal realistis.
2. `src/components/dashboard/OwnerDashboard.tsx`:
   - Tambahkan state `selectedPeriod: 'today' | 'week' | 'month' | 'all'`.
   - Buat logika filtering pesanan berdasarkan tanggal `created_at`.
   - Hitung metrik dinamis: `filteredOrders`, `periodRevenue`, `periodCogs`, `periodGrossProfit`, `periodAov`.
   - Tambahkan bar filter periode waktu responsif dengan styling tab segmen modern dan scroll horizontal tanpa scrollbar kasar di layar HP.
   - Hubungkan kartu KPI dan tabel Riwayat Transaksi ke data yang telah difilter.
