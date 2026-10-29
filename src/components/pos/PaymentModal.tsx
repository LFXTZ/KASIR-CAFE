/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { useOfflineSync } from '../../context/OfflineSyncContext.tsx';
import { formatRupiah } from '../../utils/formatters.ts';
import type { PaymentMethod, Order } from '../../types/pos.ts';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    items,
    orderType,
    selectedTableId,
    customerName,
    discountAmount,
    totalAmount,
    clearCart,
  } = useCart();

  const { isOnline, queueOfflineOrder } = useOfflineSync();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const [cardBank, setCardBank] = useState<string>('BCA');
  const [cardApprovalCode, setCardApprovalCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // QRIS Simulation State
  const [qrisStatus, setQrisStatus] = useState<'waiting' | 'paid'>('waiting');
  const [qrisTimer, setQrisTimer] = useState<number>(3);

  // Update default cash tendered when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashTendered(totalAmount);
      setPaymentMethod('cash');
      setQrisStatus('waiting');
      setQrisTimer(3);
      setErrorMessage(null);
    }
  }, [isOpen, totalAmount]);

  // Automatic QRIS Webhook simulation when QRIS tab is selected
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'qris' || qrisStatus === 'paid') return;

    const interval = setInterval(() => {
      setQrisTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSimulateQrisWebhook();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, paymentMethod, qrisStatus]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - totalAmount);
  const isCashInsufficient = paymentMethod === 'cash' && cashTendered < totalAmount;

  // Simulate automated webhook payment confirmation
  const handleSimulateQrisWebhook = async () => {
    setQrisStatus('paid');
  };

  const handleProcessCheckout = async (forcePaymentMethod?: PaymentMethod) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const activeMethod = forcePaymentMethod || paymentMethod;

    // Prepare payload
    const payload = {
      customer_name: customerName || 'Pelanggan Walk-in',
      order_type: orderType,
      table_id: selectedTableId,
      payment_method: activeMethod,
      payment_status: 'paid' as const,
      order_status: 'processing' as const,
      items: items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        notes: i.notes || undefined,
      })),
      discount_amount: discountAmount,
      cash_tendered: activeMethod === 'cash' ? cashTendered : totalAmount,
      notes: activeMethod === 'card' ? `EDC ${cardBank} Ref: ${cardApprovalCode || '883921'}` : undefined,
    };

    // If offline, store locally in buffer
    if (!isOnline) {
      const offlineOrderId = `ord-off-${Date.now()}`;
      const offlineOrder: Order = {
        id: offlineOrderId,
        order_number: `OFF-${Math.floor(1000 + Math.random() * 9000)}`,
        table_id: selectedTableId,
        table_number: orderType === 'takeaway' ? 'Takeaway Bar' : 'Meja Kasir (Offline)',
        cashier_id: 'usr-cashier-01',
        cashier_name: 'Dewi Lestari',
        customer_name: payload.customer_name,
        order_type: payload.order_type,
        subtotal: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
        tax_amount: Math.round(items.reduce((s, i) => s + i.product.price * i.quantity, 0) * 0.1),
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: activeMethod,
        payment_status: 'paid',
        order_status: 'processing',
        sync_status: 'pending_offline',
        cash_tendered: payload.cash_tendered,
        change_due: changeDue,
        items: items.map((i) => ({
          id: `item-${Date.now()}-${i.product.id}`,
          order_id: offlineOrderId,
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          price_at_purchase: i.product.price,
          cost_at_purchase: i.product.cost_price,
          subtotal: i.product.price * i.quantity,
          notes: i.notes,
        })),
        created_at: new Date().toISOString(),
      };

      queueOfflineOrder(offlineOrder);
      setIsProcessing(false);
      clearCart();
      onClose();
      onSuccess(offlineOrder);
      return;
    }

    // Call Express Checkout API (with Atomic Stock Locking)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle Atomic Stock Failure (Rollback notice)
        setErrorMessage(data.message || data.error || 'Gagal memproses transaksi.');
        setIsProcessing(false);
        return;
      }

      // If QRIS was used, send automated webhook confirmation
      if (activeMethod === 'qris') {
        try {
          await fetch('/api/webhook/qris-callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: data.order.id,
              payment_reference: `QRIS-${Date.now().toString(36).toUpperCase()}`,
            }),
          });
        } catch {
          // Non-blocking for UI
        }
      }

      setIsProcessing(false);
      clearCart();
      onClose();
      onSuccess(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan koneksi ke server.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-100 dark:text-slate-100 light:text-slate-900">
              Penyelesaian Pembayaran
            </h3>
            <span className="text-xs text-slate-400">Pilih metode bayar pelanggan</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box (e.g. Atomic Stock Failure) */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Transaksi Dibatalkan (Rollback Stok)</p>
              <p className="mt-0.5 text-rose-200">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Total Display */}
        <div className="px-6 py-4 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border-b border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Yang Harus Dibayar:</span>
          <span className="font-mono-numbers text-2xl font-extrabold text-emerald-400 dark:text-emerald-400 light:text-emerald-600">
            {formatRupiah(totalAmount)}
          </span>
        </div>

        {/* Method Tabs */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Tunai / Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                paymentMethod === 'qris'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>QRIS Dinamis</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                paymentMethod === 'card'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Kartu EDC</span>
            </button>
          </div>

          {/* TAB 1: TUNAI (CASH) */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Nominal Uang Diterima:
                </label>
                <input
                  type="number"
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl text-lg font-bold font-mono-numbers text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Suggestions */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setCashTendered(totalAmount)}
                  className="py-2 px-1 text-xs font-mono font-medium rounded-lg bg-slate-700/60 hover:bg-slate-700 text-emerald-300 border border-emerald-500/20"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() => setCashTendered(nominal)}
                    className="py-2 px-1 text-xs font-mono font-medium rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300"
                  >
                    {nominal / 1000}k
                  </button>
                ))}
              </div>

              {/* Kembalian Calculation */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Kembalian Kasir:</span>
                  <span
                    className={`font-mono-numbers text-xl font-bold ${
                      isCashInsufficient ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isCashInsufficient ? 'Uang Kurang' : formatRupiah(changeDue)}
                  </span>
                </div>
                {!isCashInsufficient && (
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Cukup
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QRIS DINAMIS & SIMULASI WEBHOOK */}
          {paymentMethod === 'qris' && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="text-center">
                <span className="text-xs font-bold tracking-wider text-slate-300">
                  QRIS STANDAR PEMBAYARAN NASIONAL
                </span>
                <p className="text-[11px] text-slate-500">Scan menggunakan GoPay, OVO, Dana, BCA, Livin</p>
              </div>

              {/* QR Code Container */}
              <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                <svg className="w-44 h-44" viewBox="0 0 100 100" fill="currentColor">
                  {/* Styled authentic QR matrix representation */}
                  <rect x="0" y="0" width="30" height="30" fill="#0F172A" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="#0F172A" />

                  <rect x="70" y="0" width="30" height="30" fill="#0F172A" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="#0F172A" />

                  <rect x="0" y="70" width="30" height="30" fill="#0F172A" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="#0F172A" />

                  <circle cx="50" cy="50" r="14" fill="#10B981" />
                  <rect x="40" y="10" width="20" height="10" fill="#0F172A" />
                  <rect x="40" y="80" width="20" height="10" fill="#0F172A" />
                  <rect x="10" y="40" width="10" height="20" fill="#0F172A" />
                  <rect x="80" y="40" width="10" height="20" fill="#0F172A" />
                  <circle cx="50" cy="50" r="6" fill="white" />
                </svg>

                {qrisStatus === 'paid' && (
                  <div className="absolute inset-0 bg-emerald-950/80 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-xs animate-fade-in">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1" />
                    <span className="font-bold text-xs">PEMBAYARAN DITERIMA</span>
                  </div>
                )}
              </div>

              {/* Status Webhook Notification */}
              <div className="w-full text-center">
                {qrisStatus === 'waiting' ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-500/10 py-2 px-3 rounded-lg border border-amber-500/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Menunggu webhook gateway... ({qrisTimer}s)
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 py-2 px-3 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Callback Gateway Terverifikasi (Status: PAID)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KARTU EDC */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Pilih Bank EDC:</label>
                <div className="grid grid-cols-4 gap-2">
                  {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setCardBank(bank)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        cardBank === bank
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Nomor Referensi / Approval Code:
                </label>
                <input
                  type="text"
                  value={cardApprovalCode}
                  onChange={(e) => setCardApprovalCode(e.target.value)}
                  placeholder="Contoh: 982144 (dari slip EDC)"
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Submit */}
        <div className="p-6 border-t border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isProcessing || isCashInsufficient}
            onClick={() => handleProcessCheckout()}
            className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Mutex Locking...</span>
              </>
            ) : (
              <>
                <span>SELESAIKAN PEMBAYARAN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
