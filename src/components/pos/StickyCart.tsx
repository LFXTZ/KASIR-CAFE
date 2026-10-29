/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { formatRupiah } from '../../utils/formatters.ts';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  Utensils,
  ShoppingBag as TakeawayIcon,
  Table as TableIcon,
  Percent,
  Check,
} from 'lucide-react';

interface StickyCartProps {
  onOpenPayment: () => void;
  onOpenTablePicker: () => void;
  onSaveOpenTab: () => void;
  isSavingOpenTab?: boolean;
}

export const StickyCart: React.FC<StickyCartProps> = ({
  onOpenPayment,
  onOpenTablePicker,
  onSaveOpenTab,
  isSavingOpenTab = false,
}) => {
  const {
    items,
    orderType,
    setOrderType,
    selectedTableNumber,
    customerName,
    setCustomerName,
    discountAmount,
    setDiscountAmount,
    subtotal,
    taxAmount,
    totalAmount,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
  } = useCart();

  const [activeNoteEditId, setActiveNoteEditId] = useState<string | null>(null);
  const [noteInputVal, setNoteInputVal] = useState<string>('');
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [discountVal, setDiscountVal] = useState<string>('');

  const handleOpenNote = (productId: string, currentNote: string) => {
    setActiveNoteEditId(productId);
    setNoteInputVal(currentNote);
  };

  const handleSaveNote = (productId: string) => {
    updateNotes(productId, noteInputVal);
    setActiveNoteEditId(null);
  };

  const handleApplyDiscount = () => {
    const parsed = parseInt(discountVal, 10);
    setDiscountAmount(isNaN(parsed) ? 0 : Math.max(0, parsed));
    setShowDiscountModal(false);
  };

  const isCartEmpty = items.length === 0;

  return (
    <div className="h-full flex flex-col bg-slate-800/90 dark:bg-slate-800/90 light:bg-white border-l border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 select-none">
      {/* Panel Top: Order Type & Meta */}
      <div className="p-4 border-b border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100 dark:text-slate-100 light:text-slate-900">
              Keranjang Pesanan
            </h3>
            <span className="text-xs text-slate-400 font-mono">({items.length} item)</span>
          </div>
          {!isCartEmpty && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Dine-In / Takeaway Segmented Control */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 rounded-xl border border-slate-700/40 dark:border-slate-700/40 light:border-slate-200">
          <button
            type="button"
            onClick={() => setOrderType('dine_in')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              orderType === 'dine_in'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Dine In
          </button>
          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              orderType === 'takeaway'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <TakeawayIcon className="w-3.5 h-3.5" />
            Takeaway
          </button>
        </div>

        {/* Customer & Table Row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan (opsional)"
            className="w-full px-3 py-2 bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-50 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />

          {orderType === 'dine_in' ? (
            <button
              type="button"
              onClick={onOpenTablePicker}
              className="flex items-center justify-between px-3 py-2 bg-slate-900/70 dark:bg-slate-900/70 light:bg-slate-50 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 rounded-lg text-slate-200 dark:text-slate-200 light:text-slate-800 hover:border-emerald-500 transition-colors"
            >
              <span className="flex items-center gap-1.5 truncate">
                <TableIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{selectedTableNumber || 'Pilih Meja'}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold shrink-0">Ganti</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/40 text-slate-400 rounded-lg border border-slate-800">
              <TakeawayIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Bar Bungkusan</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel Body: Cart Items (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isCartEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/60 flex items-center justify-center text-slate-600 mb-3 border border-slate-800">
              <ShoppingBag className="w-8 h-8 opacity-40 text-emerald-500" />
            </div>
            <p className="font-semibold text-slate-300 text-sm">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
              Pilih menu dari katalog di sebelah kiri untuk menambahkan pesanan
            </p>
          </div>
        ) : (
          items.map(({ product, quantity, notes }) => (
            <div
              key={product.id}
              className="p-3 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-700/40 dark:border-slate-700/40 light:border-slate-200 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 truncate">
                    {product.name}
                  </h5>
                  <span className="font-mono-numbers text-xs text-slate-400">
                    {formatRupiah(product.price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-800 light:bg-white rounded-lg p-0.5 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 rounded transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono-numbers font-semibold text-xs text-slate-100 dark:text-slate-100 light:text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 rounded transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-mono-numbers font-bold text-xs text-emerald-400 dark:text-emerald-400 light:text-emerald-600">
                  {formatRupiah(product.price * quantity)}
                </span>
              </div>

              {/* Item Notes */}
              {activeNoteEditId === product.id ? (
                <div className="flex items-center gap-1 pt-1">
                  <input
                    type="text"
                    value={noteInputVal}
                    onChange={(e) => setNoteInputVal(e.target.value)}
                    placeholder="Contoh: Less ice, oatmilk..."
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-800 border border-emerald-500/50 rounded text-slate-200 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveNote(product.id)}
                    className="p-1 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="truncate italic">
                    {notes ? `Catatan: ${notes}` : 'Tanpa catatan khusus'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenNote(product.id, notes)}
                    className="text-emerald-400 hover:underline shrink-0 ml-2 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {notes ? 'Ubah' : '+ Catatan'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Panel Bottom: Calculation & Primary Actions */}
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-50 space-y-3 shrink-0">
        {/* Cost Breakdown */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono-numbers">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>PPN (10%)</span>
            <span className="font-mono-numbers">{formatRupiah(taxAmount)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <button
              type="button"
              onClick={() => {
                setDiscountVal(discountAmount > 0 ? discountAmount.toString() : '');
                setShowDiscountModal(true);
              }}
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Percent className="w-3 h-3" />
              <span>Diskon {discountAmount > 0 ? `(Rp ${discountAmount.toLocaleString()})` : ''}</span>
            </button>
            <span className="font-mono-numbers text-rose-400">
              {discountAmount > 0 ? `-${formatRupiah(discountAmount)}` : 'Rp 0'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 dark:border-slate-700/60 light:border-slate-200">
            <span className="font-bold text-sm text-slate-100 dark:text-slate-100 light:text-slate-900">
              Total Tagihan
            </span>
            <span className="font-mono-numbers text-lg font-extrabold text-emerald-400 dark:text-emerald-400 light:text-emerald-600">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons (Touch Target >= 48px) */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isCartEmpty}
            onClick={onOpenPayment}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>BAYAR SEKARANG</span>
            <span className="font-mono-numbers font-extrabold">({formatRupiah(totalAmount)})</span>
          </button>

          {orderType === 'dine_in' && (
            <button
              type="button"
              disabled={isCartEmpty || isSavingOpenTab}
              onClick={onSaveOpenTab}
              className="w-full h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isSavingOpenTab ? 'Menyimpan ke Meja...' : 'SIMPAN MEJA / OPEN TAB'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Discount Dialog */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xs p-5 shadow-2xl space-y-4">
            <h4 className="font-bold text-sm text-slate-100">Atur Potongan Diskon</h4>
            <div className="space-y-2">
              <input
                type="number"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                placeholder="Nominal diskon (Rp)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono-numbers focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex gap-1.5">
                {[5000, 10000, 15000, 20000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setDiscountVal(quick.toString())}
                    className="flex-1 py-1 text-[11px] font-mono bg-slate-700/60 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {quick / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg bg-slate-700/40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="flex-1 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
