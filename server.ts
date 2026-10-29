/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'node:crypto';
import type {
  User,
  Category,
  Product,
  CafeTable,
  Order,
  OrderItem,
  CheckoutPayload,
  AnalyticsSummary,
  OrderStatus,
  PaymentStatus,
  TableStatus,
} from './src/types/pos.ts';

// ---------------------------------------------------------------------------
// Thread-Safe Mutex for Atomic Stock Concurrency Control
// ---------------------------------------------------------------------------
class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let begin: (unlock: () => void) => void = () => {};
    this.mutex = this.mutex.then(() => new Promise(begin));
    return new Promise((res) => {
      begin = res;
    });
  }
}

const stockMutex = new Mutex();

// ---------------------------------------------------------------------------
// Database In-Memory Relational Engine & Persistence
// ---------------------------------------------------------------------------
interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  tables: CafeTable[];
  orders: Order[];
}

const DB: DatabaseSchema = {
  users: [
    {
      id: 'usr-owner-01',
      name: 'Rifqy Pratama (Founder & Owner)',
      email: 'owner@elexacafe.id',
      role: 'owner',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 'usr-cashier-01',
      name: 'Dewi Lestari (Kasir Utama)',
      email: 'kasir@elexacafe.id',
      role: 'cashier',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'usr-kitchen-01',
      name: 'Bima Satria (Head Barista & KDS)',
      email: 'kitchen@elexacafe.id',
      role: 'kitchen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ],
  categories: [
    { id: 'cat-coffee', name: 'Specialty Coffee', slug: 'specialty-coffee', icon: 'Coffee' },
    { id: 'cat-tea', name: 'Artisanal Tea & Drinks', slug: 'tea-drinks', icon: 'CupSoda' },
    { id: 'cat-pastry', name: 'Pastry & Bakery', slug: 'pastry-bakery', icon: 'Croissant' },
    { id: 'cat-workshop', name: 'Workshop & Studio', slug: 'workshop-studio', icon: 'Sparkles' },
    { id: 'cat-beans', name: 'Beans & Merchandise', slug: 'beans-merch', icon: 'Package' },
  ],
  products: [
    {
      id: 'prod-01',
      name: 'Iced Spanish Latte',
      category_id: 'cat-coffee',
      sku: 'COF-SPL-01',
      price: 38000,
      cost_price: 14000,
      stock: 45,
      image_url: '/src/assets/images/hero_iced_latte_1793273612918.jpg',
      is_active: true,
    },
    {
      id: 'prod-02',
      name: 'Artisan Almond Croissant',
      category_id: 'cat-pastry',
      sku: 'PAS-ALM-02',
      price: 32000,
      cost_price: 12000,
      stock: 22,
      image_url: '/src/assets/images/artisan_croissant_1793273613588.jpg',
      is_active: true,
    },
    {
      id: 'prod-03',
      name: 'Ceremonial Matcha Cloud',
      category_id: 'cat-tea',
      sku: 'TEA-MTC-03',
      price: 42000,
      cost_price: 16000,
      stock: 28,
      image_url: '/src/assets/images/matcha_cloud_drink_1793273614559.jpg',
      is_active: true,
    },
    {
      id: 'prod-04',
      name: 'Stoneware Pottery Workshop (2h)',
      category_id: 'cat-workshop',
      sku: 'WS-POT-04',
      price: 185000,
      cost_price: 45000,
      stock: 8,
      image_url: '/src/assets/images/pottery_workshop_pass_1793273614671.jpg',
      is_active: true,
    },
    {
      id: 'prod-05',
      name: 'Double Espresso Romano',
      category_id: 'cat-coffee',
      sku: 'COF-ESP-05',
      price: 28000,
      cost_price: 8000,
      stock: 60,
      image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-06',
      name: 'Cold Drip Citrus Bloom',
      category_id: 'cat-coffee',
      sku: 'COF-DRP-06',
      price: 40000,
      cost_price: 15000,
      stock: 14,
      image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-07',
      name: 'Kouign-Amann Salted Caramel',
      category_id: 'cat-pastry',
      sku: 'PAS-KAM-07',
      price: 34000,
      cost_price: 13000,
      stock: 3, // Low stock test!
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-08',
      name: 'Pain au Chocolat Valrhona',
      category_id: 'cat-pastry',
      sku: 'PAS-PAC-08',
      price: 36000,
      cost_price: 14000,
      stock: 18,
      image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-09',
      name: 'Sparkling Yuzu Cold Brew',
      category_id: 'cat-tea',
      sku: 'TEA-YZU-09',
      price: 39000,
      cost_price: 13000,
      stock: 25,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-10',
      name: 'Coffee Cupping & Sensory Class',
      category_id: 'cat-workshop',
      sku: 'WS-CUP-10',
      price: 150000,
      cost_price: 35000,
      stock: 6,
      image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-11',
      name: 'Elexa Signature Beans (250g)',
      category_id: 'cat-beans',
      sku: 'BNS-ELX-11',
      price: 125000,
      cost_price: 60000,
      stock: 15,
      image_url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
    {
      id: 'prod-12',
      name: 'Elexa Ceramic Tumbler 350ml',
      category_id: 'cat-beans',
      sku: 'MRC-TMB-12',
      price: 195000,
      cost_price: 85000,
      stock: 2, // Low stock test!
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
      is_active: true,
    },
  ],
  tables: [
    { id: 'tbl-01', table_number: 'Meja 01', area: 'Indoor AC', capacity: 2, status: 'available' },
    { id: 'tbl-02', table_number: 'Meja 02', area: 'Indoor AC', capacity: 4, status: 'occupied', current_order_id: 'ord-initial-01' },
    { id: 'tbl-03', table_number: 'Meja 03', area: 'Indoor AC', capacity: 4, status: 'available' },
    { id: 'tbl-04', table_number: 'Meja 04', area: 'Indoor AC', capacity: 6, status: 'reserved' },
    { id: 'tbl-w1', table_number: 'Studio W-01', area: 'Workshop Studio', capacity: 8, status: 'occupied', current_order_id: 'ord-initial-02' },
    { id: 'tbl-w2', table_number: 'Studio W-02', area: 'Workshop Studio', capacity: 6, status: 'available' },
    { id: 'tbl-o1', table_number: 'Outdoor O-01', area: 'Outdoor Terrace', capacity: 4, status: 'available' },
    { id: 'tbl-o2', table_number: 'Outdoor O-02', area: 'Outdoor Terrace', capacity: 4, status: 'available' },
    { id: 'tbl-o3', table_number: 'Outdoor O-03', area: 'Outdoor Terrace', capacity: 2, status: 'available' },
  ],
  orders: [
    {
      id: 'ord-initial-01',
      order_number: 'ELX-1001',
      table_id: 'tbl-02',
      table_number: 'Meja 02',
      cashier_id: 'usr-cashier-01',
      cashier_name: 'Dewi Lestari',
      customer_name: 'Dimas Aditya',
      order_type: 'dine_in',
      subtotal: 70000,
      tax_amount: 7000,
      discount_amount: 0,
      total_amount: 77000,
      payment_method: 'unpaid',
      payment_status: 'pending',
      order_status: 'processing',
      sync_status: 'synced',
      notes: 'Less ice on latte',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      items: [
        {
          id: 'item-01',
          order_id: 'ord-initial-01',
          product_id: 'prod-01',
          product_name: 'Iced Spanish Latte',
          quantity: 1,
          price_at_purchase: 38000,
          cost_at_purchase: 14000,
          subtotal: 38000,
          notes: 'Less ice, normal sweet',
        },
        {
          id: 'item-02',
          order_id: 'ord-initial-01',
          product_id: 'prod-02',
          product_name: 'Artisan Almond Croissant',
          quantity: 1,
          price_at_purchase: 32000,
          cost_at_purchase: 12000,
          subtotal: 32000,
          notes: 'Warm it up please',
        },
      ],
    },
    {
      id: 'ord-initial-02',
      order_number: 'ELX-1002',
      table_id: 'tbl-w1',
      table_number: 'Studio W-01',
      cashier_id: 'usr-cashier-01',
      cashier_name: 'Dewi Lestari',
      customer_name: 'Sarah & Friends',
      order_type: 'dine_in',
      subtotal: 370000,
      tax_amount: 37000,
      discount_amount: 0,
      total_amount: 407000,
      payment_method: 'qris',
      payment_status: 'paid',
      order_status: 'ready',
      sync_status: 'synced',
      notes: 'Workshop pass x2',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      items: [
        {
          id: 'item-03',
          order_id: 'ord-initial-02',
          product_id: 'prod-04',
          product_name: 'Stoneware Pottery Workshop (2h)',
          quantity: 2,
          price_at_purchase: 185000,
          cost_at_purchase: 45000,
          subtotal: 370000,
          notes: 'Session 10:00 AM',
        },
      ],
    },
    {
      id: 'ord-initial-03',
      order_number: 'ELX-1000',
      table_id: null,
      table_number: 'Takeaway Bar',
      cashier_id: 'usr-cashier-01',
      cashier_name: 'Dewi Lestari',
      customer_name: 'Reza Fahmi',
      order_type: 'takeaway',
      subtotal: 80000,
      tax_amount: 8000,
      discount_amount: 5000,
      total_amount: 83000,
      payment_method: 'cash',
      payment_status: 'paid',
      order_status: 'completed',
      sync_status: 'synced',
      cash_tendered: 100000,
      change_due: 17000,
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      items: [
        {
          id: 'item-04',
          order_id: 'ord-initial-03',
          product_id: 'prod-03',
          product_name: 'Ceremonial Matcha Cloud',
          quantity: 1,
          price_at_purchase: 42000,
          cost_at_purchase: 16000,
          subtotal: 42000,
          notes: 'Oatmilk sub',
        },
        {
          id: 'item-05',
          order_id: 'ord-initial-03',
          product_id: 'prod-01',
          product_name: 'Iced Spanish Latte',
          quantity: 1,
          price_at_purchase: 38000,
          cost_at_purchase: 14000,
          subtotal: 38000,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Server Initialization
// ---------------------------------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Request logger for debugging API calls
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api/')) {
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
      }
    });
    next();
  });

  // -------------------------------------------------------------------------
  // Auth API
  // -------------------------------------------------------------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = DB.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email tidak ditemukan di sistem ELEXA CAFE' });
    }

    // Demo password validator (any password >= 4 chars or match default)
    if (!password || password.length < 4) {
      return res.status(401).json({ success: false, message: 'Password minimal 4 karakter' });
    }

    return res.json({
      success: true,
      user,
      token: `jwt-demo-${user.id}-${Date.now()}`,
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ user: DB.users[0] }); // default to owner if no token
    }
    const token = authHeader.replace('Bearer ', '');
    const user = DB.users.find((u) => token.includes(u.id)) || DB.users[0];
    return res.json({ user });
  });

  app.get('/api/users', (_req: Request, res: Response) => {
    return res.json({ success: true, users: DB.users });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Field name, email, dan role wajib diisi' });
    }
    const existing = DB.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email staff sudah terdaftar' });
    }

    const newUser: User = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      role,
      created_at: new Date().toISOString(),
    };
    DB.users.push(newUser);
    return res.status(201).json({ success: true, user: newUser });
  });

  // -------------------------------------------------------------------------
  // Categories & Products API
  // -------------------------------------------------------------------------
  app.get('/api/categories', (_req: Request, res: Response) => {
    return res.json({ success: true, categories: DB.categories });
  });

  app.get('/api/products', (_req: Request, res: Response) => {
    return res.json({ success: true, products: DB.products });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const { name, category_id, sku, price, cost_price, stock, image_url } = req.body;
    if (!name || !category_id || !sku || price === undefined) {
      return res.status(400).json({ success: false, message: 'Data produk tidak lengkap' });
    }

    const newProduct: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      name,
      category_id,
      sku: sku.toUpperCase(),
      price: Number(price),
      cost_price: Number(cost_price || 0),
      stock: Number(stock || 0),
      image_url: image_url || '/src/assets/images/hero_iced_latte_1793273612918.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DB.products.unshift(newProduct);
    return res.status(201).json({ success: true, product: newProduct });
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = DB.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const existing = DB.products[index];
    const updated: Product = {
      ...existing,
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
      cost_price: req.body.cost_price !== undefined ? Number(req.body.cost_price) : existing.cost_price,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
      updated_at: new Date().toISOString(),
    };
    DB.products[index] = updated;
    return res.json({ success: true, product: updated });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = DB.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    DB.products.splice(index, 1);
    return res.json({ success: true, message: 'Produk berhasil dihapus' });
  });

  // -------------------------------------------------------------------------
  // Tables & Open Tab API
  // -------------------------------------------------------------------------
  app.get('/api/tables', (_req: Request, res: Response) => {
    const tablesWithOrders = DB.tables.map((table) => {
      let activeOrder: Order | undefined;
      if (table.current_order_id) {
        activeOrder = DB.orders.find((o) => o.id === table.current_order_id && o.order_status !== 'completed' && o.order_status !== 'cancelled');
      }
      return {
        ...table,
        active_order: activeOrder || null,
      };
    });
    return res.json({ success: true, tables: tablesWithOrders });
  });

  app.post('/api/tables/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as { status: TableStatus };
    const table = DB.tables.find((t) => t.id === id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }
    table.status = status;
    if (status === 'available') {
      table.current_order_id = null;
    }
    return res.json({ success: true, table });
  });

  // -------------------------------------------------------------------------
  // Checkout API with ATOMIC STOCK LOCKING & CONCURRENCY CONTROL
  // -------------------------------------------------------------------------
  app.post('/api/checkout', async (req: Request, res: Response) => {
    const unlock = await stockMutex.lock();
    try {
      const payload: CheckoutPayload = req.body;
      const {
        customer_name,
        order_type,
        table_id,
        payment_method,
        payment_status,
        order_status,
        items,
        discount_amount = 0,
        cash_tendered,
        notes,
        offline_id,
      } = payload;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Keranjang belanja tidak boleh kosong' });
      }

      // Step 1: Pre-validation & Atomic Stock Verification
      const outOfStockItems: { name: string; sku: string; available: number; requested: number }[] = [];
      const validatedProducts: { product: Product; quantity: number; notes?: string }[] = [];

      for (const item of items) {
        const product = DB.products.find((p) => p.id === item.product_id);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Produk dengan ID ${item.product_id} tidak ditemukan di katalog`,
          });
        }

        // Concurrency Guard: Check stock sufficiency
        if (product.stock < item.quantity) {
          outOfStockItems.push({
            name: product.name,
            sku: product.sku,
            available: product.stock,
            requested: item.quantity,
          });
        } else {
          validatedProducts.push({
            product,
            quantity: item.quantity,
            notes: item.notes,
          });
        }
      }

      // If any item failed stock check, abort entire transaction (ROLLBACK)
      if (outOfStockItems.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Stok tidak mencukupi untuk memproses pesanan',
          details: outOfStockItems,
          message: `Stok tidak mencukupi untuk: ${outOfStockItems.map((i) => `${i.name} (Sisa: ${i.available}, Diminta: ${i.requested})`).join(', ')}`,
        });
      }

      // Step 2: Atomic Decrement
      for (const { product, quantity } of validatedProducts) {
        product.stock -= quantity;
        product.updated_at = new Date().toISOString();
      }

      // Step 3: Compute Financials
      let subtotal = 0;
      let totalCost = 0;
      const orderId = offline_id || `ord-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 4)}`;
      const orderItems: OrderItem[] = validatedProducts.map(({ product, quantity, notes: itemNotes }) => {
        const itemSubtotal = product.price * quantity;
        const itemCost = product.cost_price * quantity;
        subtotal += itemSubtotal;
        totalCost += itemCost;

        return {
          id: `item-${crypto.randomUUID().slice(0, 8)}`,
          order_id: orderId,
          product_id: product.id,
          product_name: product.name,
          quantity,
          price_at_purchase: product.price,
          cost_at_purchase: product.cost_price,
          subtotal: itemSubtotal,
          notes: itemNotes,
        };
      });

      const taxAmount = Math.round(subtotal * 0.1); // PPN 10%
      const totalAmount = Math.max(0, subtotal + taxAmount - discount_amount);
      const changeDue = cash_tendered && cash_tendered >= totalAmount ? cash_tendered - totalAmount : 0;

      // Find Table info
      let tableNumber: string | null = null;
      if (table_id) {
        const tbl = DB.tables.find((t) => t.id === table_id);
        if (tbl) {
          tableNumber = tbl.table_number;
          // Mark table as occupied for Open Tab or Dine In
          tbl.status = 'occupied';
          tbl.current_order_id = orderId;
        }
      }

      // Get Cashier
      const cashier = DB.users.find((u) => u.role === 'cashier') || DB.users[0];

      // Generate Clean Order Number (e.g. ELX-1048)
      const orderSequence = 1000 + DB.orders.length + 1;
      const orderNumber = `ELX-${orderSequence}`;

      const newOrder: Order = {
        id: orderId,
        order_number: orderNumber,
        table_id: table_id || null,
        table_number: tableNumber || (order_type === 'takeaway' ? 'Takeaway Bar' : 'Meja Kasir'),
        cashier_id: cashier.id,
        cashier_name: cashier.name,
        customer_name: customer_name || 'Tamu Pelanggan',
        order_type,
        subtotal,
        tax_amount: taxAmount,
        discount_amount,
        total_amount: totalAmount,
        payment_method,
        payment_status: payment_status || (payment_method === 'unpaid' ? 'pending' : 'paid'),
        order_status: order_status || 'processing',
        sync_status: 'synced',
        cash_tendered: cash_tendered || undefined,
        change_due: changeDue,
        notes,
        items: orderItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      DB.orders.unshift(newOrder);

      return res.status(201).json({
        success: true,
        order: newOrder,
        message: 'Transaksi pesanan berhasil diproses',
      });
    } catch (err: any) {
      console.error('[CHECKOUT ERROR]', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal saat transaksi', error: err.message });
    } finally {
      unlock();
    }
  });

  // -------------------------------------------------------------------------
  // Automatic QRIS Webhook / Gateway Simulation
  // -------------------------------------------------------------------------
  app.post('/api/webhook/qris-callback', (req: Request, res: Response) => {
    const { order_id, payment_reference } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'order_id wajib disertakan' });
    }

    const order = DB.orders.find((o) => o.id === order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    order.payment_status = 'paid';
    order.payment_method = 'qris';
    order.updated_at = new Date().toISOString();

    console.log(`[QRIS WEBHOOK] Pembayaran sukses untuk Order ${order.order_number} (${order_id}) ref: ${payment_reference || 'QRIS-SIM-OK'}`);

    return res.json({
      success: true,
      message: 'Status pembayaran QRIS berhasil diverifikasi dan disetujui otomatis',
      order,
    });
  });

  // -------------------------------------------------------------------------
  // Kitchen Display System (KDS) API
  // -------------------------------------------------------------------------
  app.get('/api/kds/orders', (_req: Request, res: Response) => {
    // Return all orders created today, sorted oldest to newest for queue order
    const kdsOrders = DB.orders
      .filter((o) => o.order_status !== 'cancelled')
      .slice(0, 50);
    return res.json({ success: true, orders: kdsOrders });
  });

  app.patch('/api/kds/orders/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as { status: OrderStatus };
    const order = DB.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    order.order_status = status;
    order.updated_at = new Date().toISOString();

    // If order completed and table was occupied, release table if paid
    if (status === 'completed' && order.table_id && order.payment_status === 'paid') {
      const tbl = DB.tables.find((t) => t.id === order.table_id);
      if (tbl && tbl.current_order_id === order.id) {
        tbl.status = 'available';
        tbl.current_order_id = null;
      }
    }

    return res.json({ success: true, order });
  });

  // -------------------------------------------------------------------------
  // Settle / Close Open Tab for a Table
  // -------------------------------------------------------------------------
  app.post('/api/tables/:id/close-tab', (req: Request, res: Response) => {
    const { id } = req.params;
    const { payment_method, cash_tendered } = req.body;
    const table = DB.tables.find((t) => t.id === id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Meja tidak ditemukan' });
    }

    if (!table.current_order_id) {
      return res.status(400).json({ success: false, message: 'Meja ini tidak memiliki pesanan aktif' });
    }

    const order = DB.orders.find((o) => o.id === table.current_order_id);
    if (!order) {
      table.status = 'available';
      table.current_order_id = null;
      return res.status(404).json({ success: false, message: 'Data pesanan meja tidak ditemukan' });
    }

    order.payment_method = payment_method || 'cash';
    order.payment_status = 'paid';
    if (cash_tendered) {
      order.cash_tendered = Number(cash_tendered);
      order.change_due = Math.max(0, Number(cash_tendered) - order.total_amount);
    }
    order.updated_at = new Date().toISOString();

    // Release table
    table.status = 'available';
    table.current_order_id = null;

    return res.json({ success: true, message: 'Tab meja berhasil dilunasi', order });
  });

  // -------------------------------------------------------------------------
  // Offline Sync API: Batch insert offline orders
  // -------------------------------------------------------------------------
  app.post('/api/sync/offline-orders', async (req: Request, res: Response) => {
    const unlock = await stockMutex.lock();
    try {
      const { offline_orders } = req.body as { offline_orders: Order[] };
      if (!Array.isArray(offline_orders) || offline_orders.length === 0) {
        return res.json({ success: true, synced_count: 0, message: 'Tidak ada antrean pesanan offline' });
      }

      const syncedOrders: Order[] = [];
      const failedOrders: { id: string; reason: string }[] = [];

      for (const offOrder of offline_orders) {
        // Prevent duplicate sync
        if (DB.orders.some((o) => o.id === offOrder.id)) {
          syncedOrders.push(offOrder);
          continue;
        }

        // Deduct stock if available
        let stockOk = true;
        for (const item of offOrder.items) {
          const prod = DB.products.find((p) => p.id === item.product_id);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
          }
        }

        const cleanOrder: Order = {
          ...offOrder,
          sync_status: 'synced',
          updated_at: new Date().toISOString(),
        };

        DB.orders.unshift(cleanOrder);
        syncedOrders.push(cleanOrder);
      }

      return res.json({
        success: true,
        synced_count: syncedOrders.length,
        failed_count: failedOrders.length,
        message: `Sinkronisasi offline selesai: ${syncedOrders.length} transaksi disinkronkan`,
      });
    } finally {
      unlock();
    }
  });

  // -------------------------------------------------------------------------
  // Orders & Audit Log API
  // -------------------------------------------------------------------------
  app.get('/api/orders', (req: Request, res: Response) => {
    const { cashier_id, shift_today, status } = req.query;
    let list = [...DB.orders];

    if (cashier_id) {
      list = list.filter((o) => o.cashier_id === cashier_id);
    }

    if (shift_today === 'true') {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter((o) => o.created_at.startsWith(today));
    }

    if (status) {
      list = list.filter((o) => o.order_status === status);
    }

    return res.json({ success: true, orders: list });
  });

  // -------------------------------------------------------------------------
  // Analytics & Business Intelligence for Owner
  // -------------------------------------------------------------------------
  app.get('/api/analytics', (_req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = DB.orders.filter((o) => o.created_at.startsWith(today) && o.order_status !== 'cancelled');

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

    todayOrders.forEach((o) => {
      todayRevenue += o.total_amount;
      const orderHour = new Date(o.created_at).getHours();
      const bucketHour = `${Math.floor(orderHour / 2) * 2}`.padStart(2, '0') + ':00';
      if (hourlyMap[bucketHour]) {
        hourlyMap[bucketHour].sales += o.total_amount;
        hourlyMap[bucketHour].count += 1;
      }

      o.items.forEach((item) => {
        const itemCost = (item.cost_at_purchase || 0) * item.quantity;
        todayCogs += itemCost;

        if (!productSoldMap[item.product_id]) {
          productSoldMap[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
        }
        productSoldMap[item.product_id].qty += item.quantity;
        productSoldMap[item.product_id].revenue += item.subtotal;
      });
    });

    const todayGrossProfit = todayRevenue - todayCogs;
    const aov = todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;
    const lowStockCount = DB.products.filter((p) => p.stock <= 5).length;

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

    const analytics: AnalyticsSummary = {
      today_revenue: todayRevenue,
      today_gross_profit: todayGrossProfit,
      today_cogs: todayCogs,
      today_orders_count: todayOrders.length,
      average_order_value: aov,
      low_stock_count: lowStockCount,
      hourly_sales: hourlySales,
      top_products: topProducts,
    };

    return res.json({ success: true, analytics });
  });

  // -------------------------------------------------------------------------
  // Vite Integration (Dev Mode: Vite Middlewares; Prod: Static Assets)
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`☕ ELEXA CAFE Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
