-- =========================================================================
-- ELEXA CAFE — Point of Sale (POS), KDS & Business Management System
-- Relational Database Schema (SQL DDL Definition)
-- Compatible with PostgreSQL & SQLite 3
-- =========================================================================

-- 1. Users / Staff Table (Role-Based Access Control)
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

-- 3. Products Table (Katalog Produk & Inventaris)
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id VARCHAR(36) REFERENCES categories(id) ON DELETE RESTRICT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0), -- HPP untuk laba kotor
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),          -- Atomic concurrency guard
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cafe Tables Table (Manajemen Denah Meja & Area)
CREATE TABLE cafe_tables (
    id VARCHAR(36) PRIMARY KEY,
    table_number VARCHAR(20) UNIQUE NOT NULL,
    area VARCHAR(50) NOT NULL CHECK (area IN ('Indoor AC', 'Workshop Studio', 'Outdoor Terrace')),
    capacity INTEGER DEFAULT 4 CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved'))
);

-- 5. Orders / Transactions Table
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    table_id VARCHAR(36) REFERENCES cafe_tables(id) ON DELETE SET NULL,
    cashier_id VARCHAR(36) REFERENCES users(id),
    customer_name VARCHAR(100) DEFAULT 'Pelanggan',
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')),
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    tax_amount INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),       -- PPN 10%
    discount_amount INTEGER DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
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
    price_at_purchase INTEGER NOT NULL CHECK (price_at_purchase >= 0),
    cost_at_purchase INTEGER NOT NULL DEFAULT 0,
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    notes TEXT
);

-- Performance Indexes for Real-Time Querying & Concurrency
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
