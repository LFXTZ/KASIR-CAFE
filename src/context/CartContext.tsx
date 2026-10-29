/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { CartItem, Product, OrderType } from '../types/pos.ts';

interface CartContextType {
  items: CartItem[];
  orderType: OrderType;
  selectedTableId: string | null;
  selectedTableNumber: string | null;
  customerName: string;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (tableId: string | null, tableNumber: string | null) => void;
  setCustomerName: (name: string) => void;
  setDiscountAmount: (discount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const addItem = (product: Product, quantity: number = 1, notes: string = '') => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        // Check local stock boundary
        if (newQty <= product.stock) {
          updated[existingIndex].quantity = newQty;
          if (notes) {
            updated[existingIndex].notes = notes;
          }
        }
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, notes } : item))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setDiscountAmount(0);
    setCustomerName('');
    setSelectedTableId(null);
    setSelectedTableNumber(null);
  };

  const setSelectedTable = (tableId: string | null, tableNumber: string | null) => {
    setSelectedTableId(tableId);
    setSelectedTableNumber(tableNumber);
    if (tableId) {
      setOrderType('dine_in');
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * 0.1); // PPN 10%
  }, [subtotal]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - discountAmount);
  }, [subtotal, taxAmount, discountAmount]);

  return (
    <CartContext.Provider
      value={{
        items,
        orderType,
        selectedTableId,
        selectedTableNumber,
        customerName,
        discountAmount,
        subtotal,
        taxAmount,
        totalAmount,
        addItem,
        updateQuantity,
        updateNotes,
        removeItem,
        clearCart,
        setOrderType,
        setSelectedTable,
        setCustomerName,
        setDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
