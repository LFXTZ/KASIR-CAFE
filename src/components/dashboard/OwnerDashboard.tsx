/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { AnalyticsSummary, Product, Category, User, Order } from '../../types/pos.ts';
import { formatRupiah, formatDateTime } from '../../utils/formatters.ts';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Package,
  Users,
  History,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  RefreshCw,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import {
  fetchAnalyticsApi,
  fetchProductsApi,
  fetchCategoriesApi,
  fetchKdsOrdersApi,
  saveLocalProducts,
  getLocalProducts,
} from '../../services/storageService.ts';

export const OwnerDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'staff' | 'history'>('analytics');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Product Add / Edit Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: 'cat-coffee',
    sku: '',
    price: '',
    cost_price: '',
    stock: '',
    image_url: '',
  });

  // Staff Add Modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'cashier' as const,
  });

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [anData, prodData, catData, ordData] = await Promise.all([
        fetchAnalyticsApi(),
        fetchProductsApi(),
        fetchCategoriesApi(),
        fetchKdsOrdersApi(),
      ]);

      setAnalytics(anData);
      setProducts(prodData);
      setCategories(catData);
      setOrders(ordData);

      // Fetch users
      try {
        const uRes = await fetch('/api/users');
        const uData = await uRes.json();
        if (uData.success) setUsers(uData.users);
      } catch {
        // Fallback demo users
        setUsers([
          { id: 'usr-owner-01', name: 'Rifqy Pratama', email: 'owner@elexacafe.id', role: 'owner', created_at: new Date().toISOString() },
          { id: 'usr-cashier-01', name: 'Dewi Lestari', email: 'kasir@elexacafe.id', role: 'cashier', created_at: new Date().toISOString() },
          { id: 'usr-kitchen-01', name: 'Bima Satria', email: 'kitchen@elexacafe.id', role: 'kitchen', created_at: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category_id: categories[0]?.id || 'cat-coffee',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      price: '',
      cost_price: '',
      stock: '20',
      image_url: '/src/assets/images/hero_iced_latte_1793273612918.jpg',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category_id: prod.category_id,
      sku: prod.sku,
      price: prod.price.toString(),
      cost_price: prod.cost_price.toString(),
      stock: prod.stock.toString(),
      image_url: prod.image_url,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentProducts = getLocalProducts();
      let updated: Product[];

      if (editingProduct) {
        updated = currentProducts.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name,
                category_id: productForm.category_id,
                sku: productForm.sku,
                price: Number(productForm.price),
                cost_price: Number(productForm.cost_price),
                stock: Number(productForm.stock),
                updated_at: new Date().toISOString(),
              }
            : p
        );
      } else {
        const newProd: Product = {
          id: `prod-${Date.now().toString(36)}`,
          name: productForm.name,
          category_id: productForm.category_id,
          sku: productForm.sku,
          price: Number(productForm.price),
          cost_price: Number(productForm.cost_price),
          stock: Number(productForm.stock),
          image_url: productForm.image_url || '/src/assets/images/hero_iced_latte_1793273612918.jpg',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        updated = [newProd, ...currentProducts];
      }

      saveLocalProducts(updated);
      setIsProductModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Kesalahan saat menyimpan');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      const currentProducts = getLocalProducts();
      const updated = currentProducts.filter((p) => p.id !== id);
      saveLocalProducts(updated);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsStaffModalOpen(false);
        setStaffForm({ name: '', email: '', role: 'cashier' });
        fetchDashboardData();
      } else {
        alert(data.message || 'Gagal menambahkan karyawan');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan saat registrasi staff');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/95 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Owner & Founder Dashboard
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Akses Penuh / Admin
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Analitik keuangan, margin laba kotor, manajemen stok, dan staff kasir
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analitik & Laba</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'inventory'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventaris & Produk</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Transaksi</span>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'staff'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff & Kasir</span>
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: ANALYTICS & PROFIT */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Omzet Card */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Omzet Hari Ini</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-2">
                  <span className="font-mono-numbers text-2xl font-extrabold text-slate-100">
                    {formatRupiah(analytics.today_revenue)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Dari {analytics.today_orders_count} transaksi berhasil
                </span>
              </div>

              {/* Laba Kotor Card */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 flex flex-col justify-between ring-1 ring-emerald-500/20">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="font-semibold">Laba Kotor (Gross Profit)</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="my-2">
                  <span className="font-mono-numbers text-2xl font-extrabold text-emerald-400">
                    {formatRupiah(analytics.today_gross_profit)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  HPP / Modal: {formatRupiah(analytics.today_cogs)}
                </span>
              </div>

              {/* AOV Card */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Rata-Rata Keranjang (AOV)</span>
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                </div>
                <div className="my-2">
                  <span className="font-mono-numbers text-2xl font-extrabold text-sky-300">
                    {formatRupiah(analytics.average_order_value)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Basket size per pelanggan
                </span>
              </div>

              {/* Low Stock Warning Card */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Peringatan Stok Menipis</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="my-2">
                  <span className="font-mono-numbers text-2xl font-extrabold text-amber-400">
                    {analytics.low_stock_count} Produk
                  </span>
                </div>
                <span className="text-[11px] text-amber-500/80">
                  Batas kritis &le; 5 unit
                </span>
              </div>
            </div>

            {/* Sales Chart & Top Selling */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hourly Sales Bar Representation */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">Tren Penjualan Per Jam (Hari Ini)</h4>
                  <span className="text-xs text-slate-400">Data Real-Time</span>
                </div>

                <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-700/50">
                  {analytics.hourly_sales.map((slot) => {
                    const maxVal = Math.max(...analytics.hourly_sales.map((s) => s.sales), 100000);
                    const heightPercent = Math.max(8, Math.round((slot.sales / maxVal) * 100));

                    return (
                      <div key={slot.hour} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 whitespace-nowrap">
                          {formatRupiah(slot.sales)}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all group-hover:from-emerald-500 group-hover:to-emerald-300"
                        />
                        <span className="text-[11px] font-mono text-slate-400">{slot.hour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-4">
                <h4 className="font-bold text-sm text-slate-100">Menu Terlaris Hari Ini</h4>
                <div className="space-y-3">
                  {analytics.top_products.map((top, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block truncate max-w-[150px]">
                          {top.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {top.sold_qty} porsi terjual
                        </span>
                      </div>
                      <span className="font-mono-numbers text-xs font-bold text-emerald-400">
                        {formatRupiah(top.total_revenue)}
                      </span>
                    </div>
                  ))}
                  {analytics.top_products.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">Belum ada transaksi hari ini</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY & PRODUCTS CRUD */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Katalog Produk & Manajemen Stok</h3>
                <span className="text-xs text-slate-400">Total {products.length} item aktif di inventaris</span>
              </div>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-right">HPP (Modal)</th>
                    <th className="py-3 px-4 text-right">Margin</th>
                    <th className="py-3 px-4 text-center">Stok</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {products.map((prod) => {
                    const cat = categories.find((c) => c.id === prod.category_id);
                    const margin = prod.price - prod.cost_price;
                    const marginPercent = prod.price > 0 ? Math.round((margin / prod.price) * 100) : 0;
                    const isLow = prod.stock <= 5;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-3">
                          <img
                            src={prod.image_url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover bg-slate-900 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="truncate max-w-[200px]">{prod.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{prod.sku}</td>
                        <td className="py-3 px-4 text-slate-300">{cat?.name || '-'}</td>
                        <td className="py-3 px-4 font-mono-numbers text-right font-bold text-slate-100">
                          {formatRupiah(prod.price)}
                        </td>
                        <td className="py-3 px-4 font-mono-numbers text-right text-slate-400">
                          {formatRupiah(prod.cost_price)}
                        </td>
                        <td className="py-3 px-4 font-mono-numbers text-right text-emerald-400">
                          +{marginPercent}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono-numbers">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              prod.stock === 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {prod.stock} unit
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTION AUDIT LOG */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Riwayat Transaksi Global & Audit Log</h3>
              <span className="text-xs text-slate-400">Audit seluruh pesanan masuk, status bayar, dan kasir</span>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-700/60 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No. Order</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pelanggan & Meja</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Total Transaksi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{ord.order_number}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(ord.created_at)}</td>
                      <td className="py-3 px-4 text-slate-200">
                        {ord.customer_name} ({ord.table_number || ord.order_type})
                      </td>
                      <td className="py-3 px-4 text-slate-400">{ord.cashier_name || 'Kasir'}</td>
                      <td className="py-3 px-4 uppercase font-semibold text-slate-300">
                        {ord.payment_method}
                      </td>
                      <td className="py-3 px-4 font-mono-numbers text-right font-bold text-slate-100">
                        {formatRupiah(ord.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            ord.order_status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ord.order_status === 'ready'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                        >
                          Lihat Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Manajemen Pengguna & Kasir (RBAC)</h3>
                <span className="text-xs text-slate-400">Atur hak akses operasional staff ELEXA CAFE</span>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Staff Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.map((u) => (
                <div key={u.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-700">
                    <img
                      src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-100 truncate">{u.name}</h5>
                    <span className="text-[11px] text-slate-400 truncate block">{u.email}</span>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        u.role === 'owner'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : u.role === 'kitchen'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-teal-500/20 text-teal-400'
                      }`}
                    >
                      Role: {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal CRUD Produk */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-sm text-slate-100">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Iced Spanish Latte"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Kategori:</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">SKU / Barcode:</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">HPP / Modal (Rp):</label>
                  <input
                    type="number"
                    required
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Stok Awal:</label>
                <input
                  type="number"
                  required
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-700/50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md shadow-emerald-500/20"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Registrasi Staff */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStaff}
            className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Tambah Akun Staff Baru</h3>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Staff:</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="staff@elexacafe.id"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hak Akses (Role):</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cashier">Kasir (Terminal POS)</option>
                  <option value="kitchen">Barista & Dapur (KDS)</option>
                  <option value="owner">Owner (Akses Penuh)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-700/50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md shadow-emerald-500/20"
              >
                Simpan Staff
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Detail Order History */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  Rincian Transaksi {selectedOrder.order_number}
                </h4>
                <span className="text-[11px] text-slate-400">{formatDateTime(selectedOrder.created_at)}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Pelanggan:</span>
                <span className="font-semibold">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tipe / Meja:</span>
                <span className="font-semibold">{selectedOrder.table_number || selectedOrder.order_type}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Kasir:</span>
                <span>{selectedOrder.cashier_name}</span>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1.5 text-xs font-mono">
              {selectedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-200">
                  <span>{it.quantity}x {it.product_name}</span>
                  <span>{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{formatRupiah(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PPN 10%:</span>
                <span>{formatRupiah(selectedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1 border-t border-slate-700 font-mono-numbers">
                <span>TOTAL:</span>
                <span>{formatRupiah(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
