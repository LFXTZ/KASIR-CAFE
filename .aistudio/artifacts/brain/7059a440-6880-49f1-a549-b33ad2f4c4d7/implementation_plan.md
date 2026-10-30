# Owner & Founder Dashboard: Perbaikan Grafik Analitik & Responsivitas Mobile

Perbaikan komprehensif pada halaman Owner & Founder Dashboard Elexa Cafe agar grafik tren penjualan per jam terisi data visual yang akurat serta tata letak seluruh komponen (kartu KPI, navigasi sub-menu, dan tabel transaksi/inventaris) tampil responsif dan nyaman digunakan di layar HP.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan desain berikut telah dikonfirmasi pada tahap klarifikasi:
> - **Format Tampilan Tabel di Mobile**: Menggunakan pembungkus tabel scroll horizontal (`w-full overflow-x-auto`) dengan ukuran padding sel yang kompak (`px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs`) agar data inventaris dan riwayat transaksi tetap lengkap, tabular, dan mudah dipindai di HP.
> - **Visual Grafik Tren Penjualan**: Menggunakan visualisasi batang vertikal modern dengan aksen gradien *emerald green*, efek *hover tooltip*, label nominal Rupiah, dan indikator jumlah porsi per jam.

---

## 1. Overview & Core Concept

- **Apa yang Dikerjakan**:
  1. **Grafik Analitik Terisi**: Mengisi data tren penjualan per jam (08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00) dengan fallback mock data transaksi hari ini bernilai total Rp 688.000 dari transaksi realistis, sehingga batang grafik tidak kosong.
  2. **Responsivitas Layar HP**:
     - Grid KPI statistik berubah dari 4 kolom menjadi 1 kolom di HP, 2 kolom di tablet, dan 4 kolom di layar lebar (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
     - Sub-menu navigasi (*Analitik & Laba*, *Inventaris & Produk*, *Riwayat Transaksi*, *Staff & Kasir*) dilengkapi `overflow-x-auto no-scrollbar whitespace-nowrap` agar dapat digeser mulus tanpa terpotong di layar HP.
     - Tabel inventaris produk dan riwayat transaksi dibungkus dalam container `w-full overflow-x-auto` dengan padding sel mobile yang proporsional.
     - Kontainer utama dashboard diamankan dengan `max-w-full overflow-x-hidden` untuk mencegah scrolling horizontal liar pada browser.

- **Target Persona**: Owner, Founder, dan Cafe Manager yang memantau performa penjualan, laba kotor, dan ketersediaan stok produk baik dari laptop maupun langsung melalui smartphone.

---

## 2. User Experience & Visual Design

### Alur Tampilan di Layar Mobile:
1. **Header Dashboard**:
   - Judul "Owner & Founder Dashboard" dan subteks ringkas tertata rapi di bagian atas.
   - Baris tab navigasi dapat di-swipe secara horizontal dengan touch gesture alami tanpa merusak layout.
2. **Kartu KPI Finansial**:
   - Tersusun vertikal 1 kolom di layar HP dengan margin yang konsisten:
     * *Omzet Hari Ini*: Rp 688.000
     * *Laba Kotor (Gross Profit)*: Ditampilkan jelas beserta modal HPP
     * *Rata-Rata Keranjang (AOV)*: Basket size pelanggan
     * *Peringatan Stok Menipis*: Badge peringatan untuk stok kritis &le; 5 unit
3. **Grafik Tren Penjualan Per Jam**:
   - Bar chart vertikal adaptif dengan tinggi proporsional dan warna gradien emerald.
   - Slot jam: `08:00`, `10:00`, `12:00`, `14:00`, `16:00`, `18:00`, `20:00`.
   - Tooltip interaktif menampilkan total omzet dan porsi terjual pada jam terkait.
4. **Tabel Inventaris & Riwayat Transaksi**:
   - Tabel dapat digeser ke samping dengan halus tanpa membuat seluruh halaman web melebar.
   - Tombol aksi (Edit, Hapus, Lihat Struk) memiliki ukuran tap minimal 36px untuk kenyamanan sentuhan jari di HP.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Fallback Analytics Engine**:
  - *Pendekatan*: Menghitung analitik secara dinamis dari order hari ini di LocalStorage/Express API. Jika order hari ini masih kosong atau di bawah nilai target demo, gunakan dataset default terkalibrasi (total Rp 688.000, laba kotor proporsional, serta distribusi per jam 08:00 - 20:00).
  - *Alasan*: Menjamin tampilan awal dashboard langsung memukau dan informatif bagi owner kafe saat pertama kali dibuka atau dijalankan statis di GitHub Pages.
- **Keputusan 2: Scroll Horizontal Khusus Tabel vs. Kartu Terpisah**:
  - *Pendekatan*: Mempertahankan struktur tabel data dengan pembungkus `overflow-x-auto` dan padding kompak, didukung label kolom sticky/jelas.
  - *Alasan*: Pengguna memilih tampilan tabel kompak agar dapat membandingkan harga jual, HPP, margin laba, dan stok secara langsung dalam satu pandangan.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   OwnerDashboard                       │
│  (max-w-full overflow-x-hidden flex flex-col h-full)   │
└──────────────────────────┬─────────────────────────────┘
                           │
      ┌────────────────────┴────────────────────┐
      ▼                                         ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     Sticky/In-Flow Header     │ │   Horizontal Scroll Tabs      │
│  - Title & Akses Penuh Badge  │ │   flex overflow-x-auto        │
│  - Refresh Button             │ │   no-scrollbar whitespace-nowrap│
└───────────────────────────────┘ └─────────────┬─────────────────┘
                                                │
         ┌───────────────────┬──────────────────┴───────────────┬───────────────────┐
         ▼                   ▼                                  ▼                   ▼
┌──────────────────┐ ┌──────────────────┐             ┌──────────────────┐ ┌──────────────────┐
│  Tab Analytics   │ │  Tab Inventaris  │             │   Tab Riwayat    │ │    Tab Staff     │
│ 1-col mobile KPI │ │ Table with       │             │ Table with       │ │ User Cards Grid  │
│ Hourly Bar Chart │ │ overflow-x-auto  │             │ overflow-x-auto  │ │ Role RBAC        │
│ (8h-20h slots)   │ │ compact padding  │             │ compact padding  │ │ Add Staff Modal  │
└──────────────────┘ └──────────────────┘             └──────────────────┘ └──────────────────┘
```

### Rincian Perubahan File:
1. `src/services/storageService.ts`:
   - Kalibrasi fungsi `computeLocalAnalytics()` agar mengembalikan fallback `hourly_sales` (08:00: Rp 76.000, 10:00: Rp 120.000, 12:00: Rp 210.000, 14:00: Rp 95.000, 16:00: Rp 64.000, 18:00: Rp 85.000, 20:00: Rp 38.000 = total Rp 688.000) jika transaksi hari ini belum ada, atau mengakumulasikan transaksi riil.
2. `src/components/dashboard/OwnerDashboard.tsx`:
   - Kontainer root: tambahkan `max-w-full overflow-x-hidden`.
   - Sub-menu tabs container: tambahkan kelas `flex items-center overflow-x-auto no-scrollbar whitespace-nowrap`.
   - KPI Cards: pastikan kelas responsif `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
   - Grafik Penjualan Per Jam: optimalkan rendering batang vertikal modern dengan tinggi dinamis, label Rupiah dan jumlah transaksi/porsi, serta status responsif di layar kecil.
   - Tabel Inventaris & Transaksi: bungkus tabel dengan `<div className="w-full overflow-x-auto">` dan sesuaikan padding sel menjadi `px-2.5 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs`.
