/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Product,
  Category,
  CafeTable,
  Order,
  OrderItem,
  CheckoutPayload,
  AnalyticsSummary,
  OrderStatus,
  TableStatus,
} from '../types/pos.ts';

import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
} from '../data/mockData.ts';

const STORAGE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TABLES: 'cafe_tables',
  ORDERS: 'orders',
};

/**
 * Checks whether the app is running on a static hosting environment
 * such as GitHub Pages (*.github.io) or file:// protocol.
 */
export function isStaticHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname || '';
  return (
    hostname.includes('github.io') ||
    window.location.protocol === 'file:' ||
    window.location.port === '4173' // Vite preview static
  );
}

/**
 * Explicitly initializes LocalStorage with full mock data if keys are null, undefined,
 * or empty arrays. Ensures 100% instant hydration on component mount.
 */
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  // 1. Products
  try {
    const rawProd = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!rawProd || rawProd === 'null' || rawProd === 'undefined' || rawProd.trim() === '[]') {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
  } catch {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }

  // 2. Categories
  try {
    const rawCat = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!rawCat || rawCat === 'null' || rawCat === 'undefined' || rawCat.trim() === '[]') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
  } catch {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }

  // 3. Cafe Tables
  try {
    const rawTables = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (!rawTables || rawTables === 'null' || rawTables === 'undefined' || rawTables.trim() === '[]') {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    }
  } catch {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
  }

  // 4. Orders
  try {
    const rawOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!rawOrders || rawOrders === 'null' || rawOrders === 'undefined' || rawOrders.trim() === '[]') {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
  } catch {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  }
}

// Ensure storage is initialized immediately upon module load
initializeStorage();

// ---------------------------------------------------------------------------
// Direct LocalStorage Data Helpers
// ---------------------------------------------------------------------------

export function getLocalProducts(): Product[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveLocalProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getLocalCategories(): Category[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function getLocalTables(): (CafeTable & { active_order?: Order | null })[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLES);
    const tables: CafeTable[] = raw ? JSON.parse(raw) : INITIAL_TABLES;
    const orders = getLocalOrders();

    return tables.map((tbl) => {
      let activeOrder: Order | null = null;
      if (tbl.current_order_id) {
        activeOrder = orders.find(
          (o) => o.id === tbl.current_order_id && o.order_status !== 'completed' && o.order_status !== 'cancelled'
        ) || null;
      }
      return {
        ...tbl,
        active_order: activeOrder,
      };
    });
  } catch {
    return INITIAL_TABLES;
  }
}

export function saveLocalTables(tables: CafeTable[]): void {
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
}

export function getLocalOrders(): Order[] {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveLocalOrders(orders: Order[]): void {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export function resetToDefaultData(): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
}

// ---------------------------------------------------------------------------
// Local Atomic Stock Checkout Engine (Client-Side)
// ---------------------------------------------------------------------------

export function processLocalCheckout(payload: CheckoutPayload): {
  success: boolean;
  order?: Order;
  message?: string;
  error?: string;
  details?: { name: string; sku: string; available: number; requested: number }[];
} {
  const currentProducts = getLocalProducts();
  const outOfStock: { name: string; sku: string; available: number; requested: number }[] = [];
  const validatedItems: { product: Product; quantity: number; notes?: string }[] = [];

  // Verify stock sufficiency
  for (const item of payload.items) {
    const prod = currentProducts.find((p) => p.id === item.product_id);
    if (!prod) {
      return { success: false, message: `Produk ID ${item.product_id} tidak ditemukan` };
    }
    if (prod.stock < item.quantity) {
      outOfStock.push({
        name: prod.name,
        sku: prod.sku,
        available: prod.stock,
        requested: item.quantity,
      });
    } else {
      validatedItems.push({ product: prod, quantity: item.quantity, notes: item.notes });
    }
  }

  if (outOfStock.length > 0) {
    return {
      success: false,
      error: 'Stok tidak mencukupi untuk memproses pesanan',
      details: outOfStock,
      message: `Stok tidak mencukupi untuk: ${outOfStock.map((i) => `${i.name} (Sisa: ${i.available}, Diminta: ${i.requested})`).join(', ')}`,
    };
  }

  // Atomic decrement in LocalStorage
  const updatedProducts = currentProducts.map((p) => {
    const match = validatedItems.find((v) => v.product.id === p.id);
    if (match) {
      return { ...p, stock: p.stock - match.quantity, updated_at: new Date().toISOString() };
    }
    return p;
  });
  saveLocalProducts(updatedProducts);

  // Compute totals
  let subtotal = 0;
  const orderId = payload.offline_id || `ord-gh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const orderItems: OrderItem[] = validatedItems.map(({ product, quantity, notes }) => {
    const itemSubtotal = product.price * quantity;
    const itemCost = product.cost_price * quantity;
    subtotal += itemSubtotal;
    return {
      id: `item-${Date.now()}-${product.id}`,
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      quantity,
      price_at_purchase: product.price,
      cost_at_purchase: itemCost,
      subtotal: itemSubtotal,
      notes,
    };
  });

  const taxAmount = Math.round(subtotal * 0.1);
  const totalAmount = Math.max(0, subtotal + taxAmount - (payload.discount_amount || 0));
  const changeDue = payload.cash_tendered && payload.cash_tendered >= totalAmount
    ? payload.cash_tendered - totalAmount
    : 0;

  // Table info
  let tableNumber: string | null = null;
  if (payload.table_id) {
    const tables = getLocalTables();
    const targetTable = tables.find((t) => t.id === payload.table_id);
    if (targetTable) {
      tableNumber = targetTable.table_number;
      targetTable.status = 'occupied';
      targetTable.current_order_id = orderId;
      saveLocalTables(tables);
    }
  }

  const existingOrders = getLocalOrders();
  const orderNumber = `ELX-${1000 + existingOrders.length + 1}`;

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    table_id: payload.table_id || null,
    table_number: tableNumber || (payload.order_type === 'takeaway' ? 'Takeaway Bar' : 'Meja Kasir'),
    cashier_id: 'usr-cashier-01',
    cashier_name: 'Dewi Lestari (Kasir Utama)',
    customer_name: payload.customer_name || 'Tamu Pelanggan',
    order_type: payload.order_type,
    subtotal,
    tax_amount: taxAmount,
    discount_amount: payload.discount_amount || 0,
    total_amount: totalAmount,
    payment_method: payload.payment_method,
    payment_status: payload.payment_status || (payload.payment_method === 'unpaid' ? 'pending' : 'paid'),
    order_status: payload.order_status || 'processing',
    sync_status: 'synced',
    cash_tendered: payload.cash_tendered,
    change_due: changeDue,
    notes: payload.notes,
    items: orderItems,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveLocalOrders([newOrder, ...existingOrders]);

  return {
    success: true,
    order: newOrder,
    message: 'Transaksi pesanan berhasil diproses (LocalStorage)',
  };
}

export function updateLocalOrderStatus(orderId: string, status: OrderStatus): boolean {
  const orders = getLocalOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) return false;

  orders[orderIndex].order_status = status;
  orders[orderIndex].updated_at = new Date().toISOString();

  // If completed and table was occupied, release table
  if (status === 'completed' && orders[orderIndex].table_id) {
    const tables = getLocalTables();
    const tbl = tables.find((t) => t.id === orders[orderIndex].table_id);
    if (tbl && tbl.current_order_id === orderId) {
      tbl.status = 'available';
      tbl.current_order_id = null;
      saveLocalTables(tables);
    }
  }

  saveLocalOrders(orders);
  return true;
}

export function closeLocalTableTab(tableId: string, paymentMethod: string, cashTendered?: number): boolean {
  const tables = getLocalTables();
  const tbl = tables.find((t) => t.id === tableId);
  if (!tbl || !tbl.current_order_id) return false;

  const orders = getLocalOrders();
  const order = orders.find((o) => o.id === tbl.current_order_id);
  if (order) {
    order.payment_status = 'paid';
    order.payment_method = paymentMethod as any;
    if (cashTendered) {
      order.cash_tendered = cashTendered;
      order.change_due = Math.max(0, cashTendered - order.total_amount);
    }
    order.updated_at = new Date().toISOString();
    saveLocalOrders(orders);
  }

  tbl.status = 'available';
  tbl.current_order_id = null;
  saveLocalTables(tables);
  return true;
}

export function computeLocalAnalytics(): AnalyticsSummary {
  const today = new Date().toISOString().split('T')[0];
  const orders = getLocalOrders().filter((o) => o.created_at.startsWith(today) && o.order_status !== 'cancelled');
  const products = getLocalProducts();

  let todayRevenue = 0;
  let todayCogs = 0;
  const productSoldMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  const hourlyMap: Record<string, { sales: number; count: number }> = {
    '08:00': { sales: 0, count: 0 },
    '10:00': { sales: 0, count: 0 },
    '12:00': { sales: 0, count: 0 },
    '14:00': { sales: 0, count: 0 },
    '16:00': { sales: 0, count: 0 },
    '18:00': { sales: 0, count: 0 },
    '20:00': { sales: 0, count: 0 },
  };

  orders.forEach((o) => {
    todayRevenue += o.total_amount;
    const orderHour = new Date(o.created_at).getHours();
    const bucketHour = `${Math.floor(orderHour / 2) * 2}`.padStart(2, '0') + ':00';
    if (hourlyMap[bucketHour]) {
      hourlyMap[bucketHour].sales += o.total_amount;
      hourlyMap[bucketHour].count += 1;
    }

    o.items.forEach((item) => {
      todayCogs += (item.cost_at_purchase || 0) * item.quantity;
      if (!productSoldMap[item.product_id]) {
        productSoldMap[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
      }
      productSoldMap[item.product_id].qty += item.quantity;
      productSoldMap[item.product_id].revenue += item.subtotal;
    });
  });

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const aov = orders.length > 0 ? Math.round(todayRevenue / orders.length) : 0;

  const topProducts = Object.values(productSoldMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      sold_qty: p.qty,
      total_revenue: p.revenue,
    }));

  const hourlySales = Object.entries(hourlyMap).map(([hour, data]) => ({
    hour,
    sales: data.sales,
    count: data.count,
  }));

  return {
    today_revenue: todayRevenue,
    today_gross_profit: todayRevenue - todayCogs,
    today_cogs: todayCogs,
    today_orders_count: orders.length,
    average_order_value: aov,
    low_stock_count: lowStockCount,
    hourly_sales: hourlySales,
    top_products: topProducts,
  };
}

// ---------------------------------------------------------------------------
// Unified Data Fetchers (Zero-failure, fallback to LocalStorage)
// ---------------------------------------------------------------------------

export async function fetchProductsApi(): Promise<Product[]> {
  if (isStaticHost()) {
    return getLocalProducts();
  }
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API products error');
    const data = await res.json();
    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      saveLocalProducts(data.products);
      return data.products;
    }
    return getLocalProducts();
  } catch {
    return getLocalProducts();
  }
}

export async function fetchCategoriesApi(): Promise<Category[]> {
  if (isStaticHost()) {
    return getLocalCategories();
  }
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('API categories error');
    const data = await res.json();
    if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
      return data.categories;
    }
    return getLocalCategories();
  } catch {
    return getLocalCategories();
  }
}

export async function fetchTablesApi(): Promise<(CafeTable & { active_order?: Order | null })[]> {
  if (isStaticHost()) {
    return getLocalTables();
  }
  try {
    const res = await fetch('/api/tables');
    if (!res.ok) throw new Error('API tables error');
    const data = await res.json();
    if (data.success && Array.isArray(data.tables) && data.tables.length > 0) {
      saveLocalTables(data.tables);
      return data.tables;
    }
    return getLocalTables();
  } catch {
    return getLocalTables();
  }
}

export async function fetchKdsOrdersApi(): Promise<Order[]> {
  if (isStaticHost()) {
    return getLocalOrders();
  }
  try {
    const res = await fetch('/api/kds/orders');
    if (!res.ok) throw new Error('API KDS error');
    const data = await res.json();
    if (data.success && Array.isArray(data.orders)) {
      saveLocalOrders(data.orders);
      return data.orders;
    }
    return getLocalOrders();
  } catch {
    return getLocalOrders();
  }
}

export async function fetchAnalyticsApi(): Promise<AnalyticsSummary> {
  if (isStaticHost()) {
    return computeLocalAnalytics();
  }
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('API analytics error');
    const data = await res.json();
    if (data.success && data.analytics) {
      return data.analytics;
    }
    return computeLocalAnalytics();
  } catch {
    return computeLocalAnalytics();
  }
}

export async function submitCheckoutApi(payload: CheckoutPayload): Promise<{
  success: boolean;
  order?: Order;
  message?: string;
  error?: string;
  details?: any[];
}> {
  if (isStaticHost()) {
    return processLocalCheckout(payload);
  }
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return data;
    }
    return data;
  } catch {
    // Transparent fallback to local checkout if server unreachable
    return processLocalCheckout(payload);
  }
}

export async function updateKdsStatusApi(orderId: string, status: OrderStatus): Promise<boolean> {
  if (isStaticHost()) {
    return updateLocalOrderStatus(orderId, status);
  }
  try {
    const res = await fetch(`/api/kds/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      updateLocalOrderStatus(orderId, status);
      return true;
    }
    return updateLocalOrderStatus(orderId, status);
  } catch {
    return updateLocalOrderStatus(orderId, status);
  }
}

export async function closeTableTabApi(tableId: string, paymentMethod: string, cashTendered?: number): Promise<boolean> {
  if (isStaticHost()) {
    return closeLocalTableTab(tableId, paymentMethod, cashTendered);
  }
  try {
    const res = await fetch(`/api/tables/${tableId}/close-tab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method: paymentMethod, cash_tendered: cashTendered }),
    });
    const data = await res.json();
    if (data.success) {
      closeLocalTableTab(tableId, paymentMethod, cashTendered);
      return true;
    }
    return closeLocalTableTab(tableId, paymentMethod, cashTendered);
  } catch {
    return closeLocalTableTab(tableId, paymentMethod, cashTendered);
  }
}
