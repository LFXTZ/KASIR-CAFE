# ELEXA CAFE — Mobile Sticky Checkout Bar & Safe-Area Ergonomics (COMPLETED)

Rencana arsitektur dan penataan ulang *checkout bar* / tombol pembayaran di layar smartphone (HP) agar selalu terlihat, mudah dipencet dengan satu jempol, tidak terpotong oleh bilah navigasi browser/gesture bar iOS & Android, serta tidak menutupi produk paling bawah di katalog — telah selesai diimplementasikan dan diverifikasi 100%.

---

### Status: Selesai Diimplementasikan & Lolos Verifikasi Build

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Desain & UX Mobile (Terkonfirmasi dari Fase 1):**
> 1. **Aksi Utama Tombol Pembayaran**: Menekan tombol utama langsung membuka **Modal Pembayaran (Payment Multi-Method)** agar kasir dapat segera memproses transaksi QRIS/Tunai/Debit, sekaligus menyediakan tombol sekunder/opsi untuk membuka Drawer Keranjang guna mengecek catatan atau mengubah jumlah pesanan.
> 2. **Informasi Ringkas Bar Bawah**: Menampilkan ringkasan pesanan yang presisi berupa **total item dipilih**, **nominal total tagihan (Rp)**, dan tombol aksi tegas **"BAYAR SEKARANG"**.
> 3. **Posisi & Ergonomi Layar Sentuh**: Menggunakan `fixed bottom-0 left-0 right-0 z-50` dengan dukungan `env(safe-area-inset-bottom)` dan `100dvh`, serta menambahkan `pb-28` pada kontainer katalog produk agar kartu menu paling bawah tetap dapat di-scroll sepenuhnya ke atas tanpa tertutup bar pembayaran.

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**: Modul navigasi bawah (*Fixed Mobile Checkout Bar*) yang mengambang di bagian terbawah layar ponsel kasir saat ada minimal 1 item di keranjang belanja.
- **Pengguna Sasaran**: Kasir kafe dan barista yang mengoperasikan terminal POS menggunakan smartphone (Android / iOS) saat mobile ordering atau antrean padat di meja.
- **Nilai Utama**: Menghilangkan kendala tombol terpotong oleh gesture bar bawaan HP atau bilah navigasi Safari/Chrome mobile, mempercepat waktu checkout dengan *one-thumb reach*, dan mencegah tertutupnya katalog produk paling bawah.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Memilih Menu**: Kasir menekan produk pada katalog. Begitu keranjang terisi $\ge 1$ item, bar pembayaran muncul mulus dari bawah (*slide-up*) dengan status item dan total rupiah otomatis diperbarui secara reaktif.
2. **Scroll Katalog Bebas Hambatan**: Saat kasir scroll hingga item terakhir di kategori terbawah, kontainer produk memiliki bantalan ruang ekstra (`pb-28`), sehingga kartu menu terbawah terlihat utuh dan tombol `+` / detail tetap dapat diklik leluasa.
3. **Eksekusi Pembayaran Cepat**: Kasir menekan tombol hijau emerald `"BAYAR SEKARANG"`. Sistem langsung memunculkan **PaymentModal** (QRIS instan, Cash dengan kalkulator kembalian, Kartu Debit).
4. **Inspeksi & Catatan Item**: Jika pelanggan meminta penyesuaian ("less sugar", "extra shot"), kasir dapat menekan ikon/bagian ringkasan item di sisi kiri bar untuk membuka **Bottom Sheet / Drawer Keranjang** penuh.

#### B. Visual Identity & Mobile Ergonomics
- **Latar Belakang Bar**: `bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-800` memberikan batas visual yang tegas dan kontras tinggi terhadap katalog di baliknya.
- **Pewarnaan Aksen (60-30-10 Rule)**:
  - Tombol Utama: Emerald Green (`#10B981`) teks gelap berbobot tebal (`text-slate-950 font-bold`) dengan touch target min $48\text{px}$.
  - Ringkasan Tagihan: Angka nominal dengan format monospace (`tabular-nums font-mono-numbers`) berwarna putih/emerald berbobot ekstra tebal.
- **Safe Area Inset Padding**: Menggunakan formula `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` untuk memastikan tombol tidak pernah berhimpitan dengan home bar iPhone atau tombol navigasi 3-tombol Android.

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Fixed Global Bar vs. In-Flow Panel di Mobile**
  - *Pendekatan*: Mengubah bar mobile dari elemen yang mengalir di akhir flexbox menjadi `fixed bottom-0 left-0 right-0 z-50`.
  - *Alasan*: Pada layar ponsel dengan variasi tinggi dinamis (`dvh`) dan keyboard virtual, elemen flexbox sering kali terdorong ke luar viewport (*overflow-y hidden parent*). Penempatan fixed menjamin tombol pembayaran 100% selalu terlihat di zona jempol bawah (*Natural Reach Zone*).
  - *Alternatif yang Ditolak*: Sticky di dalam scroll wrapper sering mengalami glitch pada Safari iOS saat status bar menyusut.

- **Keputusan 2: Pemisahan Aksi Cepat Bayar vs. Drawer Rincian**
  - *Pendekatan*: Bar bawah mobile membagi dua affordance: area kiri (ikon keranjang + jumlah item + chevron) untuk membuka drawer rincian, dan tombol kanan (Emerald CTA "Bayar Sekarang") untuk langsung membuka modal pembayaran.
  - *Alasan*: Mengurangi 1 langkah (klik buka drawer -> klik bayar di drawer) saat kasir hanya ingin langsung memproses pembayaran pesanan sederhana.

---

### 4. Technical Architecture & Component Layout

```
┌────────────────────────────────────────────────────────┐
│  ELEXA CAFE — Top Navbar & In-Flow Demo Banner         │
├────────────────────────────────────────────────────────┤
│  Search Card & Category Filter Bar                     │
├────────────────────────────────────────────────────────┤
│  SCROLLABLE PRODUCT CATALOG CONTAINER                  │
│  (Menggunakan pb-28 / pb-32 agar produk bawah utuh)    │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │ Spanish Latte         │  │ Artisan Croissant     │  │
│  │ Rp 38.000             │  │ Rp 32.000             │  │
│  └───────────────────────┘  └───────────────────────┘  │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │ Matcha Cloud          │  │ Pottery Workshop Pass │  │
│  │ Rp 42.000             │  │ Rp 150.000            │  │
│  └───────────────────────┘  └───────────────────────┘  │
├────────────────────────────────────────────────────────┤
│  [FIXED MOBILE CHECKOUT BAR] (z-50, bottom-0, fixed)   │
│  ┌────────────────────────┬──────────────────────────┐ │
│  │ 🛍️ 3 Item · Rp 112.000 │ [ BAYAR SEKARANG ]       │ │
│  │ (Klik: Buka Drawer)    │ (Klik: Modal Pembayaran) │ │
│  └────────────────────────┴──────────────────────────┘ │
│  SafeArea Padding: env(safe-area-inset-bottom)         │
└────────────────────────────────────────────────────────┘
```

#### Komponen yang Diperbarui:
1. **`src/components/pos/PosTerminal.tsx`**:
   - Memindahkan Mobile Checkout Bar ke luar pembungkus kolom lokal dan menetapkan `fixed bottom-0 left-0 right-0 z-50 lg:hidden`.
   - Menambahkan pembungkus aksi: klik ringkasan kiri untuk `setIsMobileCartOpen(true)` dan tombol kanan untuk langsung membuka `setIsPaymentOpen(true)`.
   - Mengatur padding bawah pada grid produk: `pb-28 sm:pb-32` di mobile sehingga item terbawah tidak tertutup bar melayang.
   - Mengonfigurasi safe area inset: `pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]`.
2. **`src/components/pos/StickyCart.tsx`**:
   - Memastikan tombol "BAYAR SEKARANG" di dalam bottom sheet drawer juga menerapkan safe area inset padding saat drawer dibuka di HP.
