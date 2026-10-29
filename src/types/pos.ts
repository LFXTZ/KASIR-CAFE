/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'owner' | 'cashier' | 'kitchen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TableArea = 'Indoor AC' | 'Workshop Studio' | 'Outdoor Terrace';
export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface CafeTable {
  id: string;
  table_number: string;
  area: TableArea;
  capacity: number;
  status: TableStatus;
  current_order_id?: string | null;
}

export type OrderType = 'dine_in' | 'takeaway';
export type PaymentMethod = 'cash' | 'qris' | 'card' | 'unpaid';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type OrderStatus = 'processing' | 'ready' | 'completed' | 'cancelled';
export type SyncStatus = 'synced' | 'pending_offline';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  cost_at_purchase: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id?: string | null;
  table_number?: string | null;
  cashier_id: string;
  cashier_name?: string;
  customer_name: string;
  order_type: OrderType;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  sync_status: SyncStatus;
  cash_tendered?: number;
  change_due?: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export interface CheckoutPayload {
  customer_name: string;
  order_type: OrderType;
  table_id?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  items: {
    product_id: string;
    quantity: number;
    notes?: string;
  }[];
  discount_amount?: number;
  cash_tendered?: number;
  notes?: string;
  offline_id?: string;
}

export interface AnalyticsSummary {
  today_revenue: number;
  today_gross_profit: number;
  today_cogs: number;
  today_orders_count: number;
  average_order_value: number;
  low_stock_count: number;
  hourly_sales: { hour: string; sales: number; count: number }[];
  top_products: { name: string; sold_qty: number; total_revenue: number }[];
}
