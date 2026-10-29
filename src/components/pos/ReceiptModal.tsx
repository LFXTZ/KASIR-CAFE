/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Order } from '../../types/pos.ts';
import { formatRupiah, formatDateTime } from '../../utils/formatters.ts';
import { Printer, Check, X, Coffee } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onNewTransaction,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <Check className="w-4 h-4 stroke-[3]" />
            <span className="font-bold text-xs uppercase tracking-wider">Transaksi Selesai</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper (Visible on screen and printer) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white text-slate-900 p-5 rounded-xl shadow-lg font-mono text-[11px] leading-tight select-text"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1 text-slate-900">
                <Coffee className="w-6 h-6 text-slate-900" />
              </div>
              <h2 className="text-base font-extrabold tracking-tight">ELEXA CAFE</h2>
              <p className="text-[10px] text-slate-600 font-sans tracking-wide">CAFE & WORKSHOP</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Jl. Senopati No. 42, Jakarta Selatan</p>
              <p className="text-[9px] text-slate-500">Telp: (021) 582-9901</p>
            </div>

            {/* Meta Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>No. Order:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.cashier_name || 'Kasir Elexa'}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Tipe:</span>
                <span>{order.order_type === 'dine_in' ? `Dine-In (${order.table_number})` : 'Takeaway'}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span className="truncate pr-2">{item.product_name}</span>
                    <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.quantity} x {formatRupiah(item.price_at_purchase)}
                    </span>
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-slate-600 italic">
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculation Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>PPN 10%:</span>
                <span>{formatRupiah(order.tax_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs pt-1.5 border-t border-slate-300">
                <span>TOTAL:</span>
                <span className="text-sm">{formatRupiah(order.total_amount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between uppercase">
                <span>Metode Bayar:</span>
                <span className="font-bold">{order.payment_method}</span>
              </div>
              {order.cash_tendered ? (
                <>
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span>{formatRupiah(order.cash_tendered)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(order.change_due || 0)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[9px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
              <p>Password Wi-Fi: <span className="font-bold">elexacraft42</span></p>
              <p className="font-bold tracking-wider text-slate-900 pt-1">www.elexacafe.id</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-600"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Thermal</span>
          </button>

          <button
            type="button"
            onClick={onNewTransaction}
            className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
