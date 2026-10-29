/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import type { Product, Category, CafeTable, Order } from '../../types/pos.ts';
import {
  fetchProductsApi,
  fetchCategoriesApi,
  fetchTablesApi,
  submitCheckoutApi,
} from '../../services/storageService.ts';
import { formatRupiah } from '../../utils/formatters.ts';
import { ProductCard } from './ProductCard.tsx';
import { StickyCart } from './StickyCart.tsx';
import { PaymentModal } from './PaymentModal.tsx';
import { ReceiptModal } from './ReceiptModal.tsx';
import { TablePickerModal } from './TablePickerModal.tsx';
import {
  Search,
  Barcode,
  Layers,
  Sparkles,
  Coffee,
  CupSoda,
  Croissant,
  Package,
  CheckCircle2,
  ShoppingBag,
  ChevronUp,
  X,
  ArrowRight,
} from 'lucide-react';

export const PosTerminal: React.FC = () => {
  const {
    items,
    orderType,
    selectedTableId,
    customerName,
    discountAmount,
    totalAmount,
    addItem,
    setSelectedTable,
    clearCart,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [openTabFeedback, setOpenTabFeedback] = useState<string | null>(null);
  const [isSavingOpenTab, setIsSavingOpenTab] = useState<boolean>(false);

  // Initial load: uses storageService which guarantees products are never empty
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [prodList, catList, tblList] = await Promise.all([
          fetchProductsApi(),
          fetchCategoriesApi(),
          fetchTablesApi(),
        ]);

        setProducts(prodList);
        setCategories(catList);
        setTables(tblList);
      } catch (err) {
        console.error('Failed to load POS master data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter products by category, search query (name / SKU), and stock
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (activeCategory !== 'all' && prod.category_id !== activeCategory) {
        return false;
      }
      // Search query filter (Name or SKU)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesSku = prod.sku.toLowerCase().includes(query);
        if (!matchesName && !matchesSku) return false;
      }
      // Stock filter
      if (inStockOnly && prod.stock <= 0) {
        return false;
      }
      return true;
    });
  }, [products, activeCategory, searchQuery, inStockOnly]);

  // Handle Quick Barcode Scanner (Press Enter in search bar to add matching item)
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const exactMatch = products.find(
        (p) =>
          p.sku.toLowerCase() === searchQuery.toLowerCase().trim() ||
          p.name.toLowerCase() === searchQuery.toLowerCase().trim()
      );
      if (exactMatch && exactMatch.stock > 0) {
        addItem(exactMatch);
        setSearchQuery('');
      }
    }
  };

  // Save Open Tab (Pay Later / Store to Table)
  const handleSaveOpenTab = async () => {
    if (items.length === 0) return;
    setIsSavingOpenTab(true);

    try {
      const payload = {
        customer_name: customerName || 'Tamu Meja',
        order_type: orderType,
        table_id: selectedTableId || 'tbl-01',
        payment_method: 'unpaid' as const,
        payment_status: 'pending' as const,
        order_status: 'processing' as const,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        discount_amount: discountAmount,
      };

      const data = await submitCheckoutApi(payload);

      if (data.success && data.order) {
        setOpenTabFeedback(`Pesanan tersimpan di Meja (${data.order.order_number}). Masuk ke KDS Dapur!`);
        setTimeout(() => setOpenTabFeedback(null), 4000);
        clearCart();
        // Refresh products and tables
        const [updatedProds, updatedTables] = await Promise.all([fetchProductsApi(), fetchTablesApi()]);
        setProducts(updatedProds);
        setTables(updatedTables);
      } else {
        alert(data.message || data.error || 'Gagal menyimpan pesanan ke meja');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan saat menyimpan pesanan');
    } finally {
      setIsSavingOpenTab(false);
    }
  };

  const handleCheckoutSuccess = async (order: Order) => {
    setLastCompletedOrder(order);
    setIsReceiptOpen(true);
    // Refresh products to reflect decremented stock
    const updated = await fetchProductsApi();
    setProducts(updated);
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'specialty-coffee':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'tea-drinks':
        return <CupSoda className="w-3.5 h-3.5" />;
      case 'pastry-bakery':
        return <Croissant className="w-3.5 h-3.5" />;
      case 'workshop-studio':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'beans-merch':
        return <Package className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative w-full max-w-full">
      {/* Feedback Toast */}
      {openTabFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-semibold text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{openTabFeedback}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SISI KIRI (65% di Desktop, 100% di HP): CATALOG GRID & TABS   */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full lg:w-[65%] flex flex-col flex-1 h-full bg-slate-900/95 dark:bg-slate-900/95 light:bg-slate-50 border-r border-slate-800 dark:border-slate-800 light:border-slate-200 overflow-hidden">
        {/* Top Control Bar: Search & Barcode SKU */}
        <div className="p-3 sm:p-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-2.5 sm:space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Quick Search / Barcode Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeSubmit}
                placeholder="Cari menu kafe atau scan barcode SKU..."
                className="w-full h-10 sm:h-11 pl-10 pr-10 bg-slate-800/80 dark:bg-slate-800/80 light:bg-white border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 rounded-xl text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" title="Scanner barcode aktif">
                <Barcode className="w-4 h-4" />
              </span>
            </div>

            {/* In-Stock Filter */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                inStockOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              <span>Hanya Stok Tersedia</span>
            </button>
          </div>

          {/* Category Tabs (Horizontal Scrollable) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full max-w-full">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-800/60 dark:bg-slate-800/60 light:bg-white text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-700/50 dark:border-slate-700/50 light:border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Menu</span>
              <span className="text-[10px] font-mono opacity-80">({products.length})</span>
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'bg-slate-800/60 dark:bg-slate-800/60 light:bg-white text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-700/50 dark:border-slate-700/50 light:border-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat.slug)}
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid Area (Scrollable with bottom padding for mobile fixed bar) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-28 sm:pb-32 lg:pb-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-28 sm:pb-32 lg:pb-4">
              {[1, 2, 3, 4, 5, 6].map((sk) => (
                <div key={sk} className="h-60 sm:h-64 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-700/40" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 pb-28 lg:pb-8">
              <Coffee className="w-12 h-12 mb-2 opacity-30 text-emerald-400" />
              <p className="font-semibold text-slate-300">Tidak ada produk yang sesuai</p>
              <p className="text-xs text-slate-500 mt-1">
                Coba ubah kata kunci pencarian atau pilih kategori lain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-28 sm:pb-32 lg:pb-4">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} onAddToCart={addItem} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SISI KANAN (35% LEBAR di Desktop): STICKY CART PANEL          */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-[35%] h-full">
        <StickyCart
          onOpenPayment={() => setIsPaymentOpen(true)}
          onOpenTablePicker={() => setIsTablePickerOpen(true)}
          onSaveOpenTab={handleSaveOpenTab}
          isSavingOpenTab={isSavingOpenTab}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE DRAWER / BOTTOM SHEET KERANJANG DI HP                  */}
      {/* ------------------------------------------------------------- */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-800 w-full max-h-[88vh] rounded-t-3xl border-t border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            {/* Drawer Header */}
            <div className="px-5 py-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-slate-100">Keranjang Pesanan</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart content inside drawer */}
            <div className="flex-1 overflow-hidden">
              <StickyCart
                onOpenPayment={() => {
                  setIsMobileCartOpen(false);
                  setIsPaymentOpen(true);
                }}
                onOpenTablePicker={() => setIsTablePickerOpen(true)}
                onSaveOpenTab={() => {
                  handleSaveOpenTab();
                  setIsMobileCartOpen(false);
                }}
                isSavingOpenTab={isSavingOpenTab}
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FIXED MOBILE CHECKOUT BAR (Hanya di Layar HP saat ada item)   */}
      {/* Fixed di bottom-0, z-40, safe-area-inset-bottom, min h-48px   */}
      {/* ------------------------------------------------------------- */}
      {items.length > 0 && !isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 backdrop-blur-md border-t border-slate-800 dark:border-slate-800 light:border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl transition-all pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center justify-between gap-2.5 max-w-lg mx-auto">
            {/* Opsi Lihat Keranjang / Detail Item */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors text-left shrink-0 active:scale-[0.98]"
              title="Lihat rincian keranjang pesanan"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1">
                  <span>{items.reduce((s, i) => s + i.quantity, 0)} Item</span>
                  <ChevronUp className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-sm font-extrabold font-mono-numbers text-white dark:text-white light:text-slate-900 leading-tight">
                  {formatRupiah(totalAmount)}
                </div>
              </div>
            </button>

            {/* Tombol Utama Bayar Sekarang (Touch Target min 48px, Emerald Green) */}
            <button
              type="button"
              onClick={() => setIsPaymentOpen(true)}
              className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>BAYAR SEKARANG</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Multi-Method Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        order={lastCompletedOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onNewTransaction={() => setIsReceiptOpen(false)}
      />

      {/* Table Picker Modal */}
      <TablePickerModal
        isOpen={isTablePickerOpen}
        onClose={() => setIsTablePickerOpen(false)}
        tables={tables}
        selectedTableId={selectedTableId}
        onSelectTable={(id, num) => setSelectedTable(id, num)}
      />
    </div>
  );
};
