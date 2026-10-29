/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '../../types/pos.ts';
import { formatTimeOnly, getElapsedTimeMinutes } from '../../utils/formatters.ts';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Utensils,
  ShoppingBag,
  Bell,
  ArrowRight,
} from 'lucide-react';

export const KitchenDisplaySystem: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/kds/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load KDS orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto polling every 8 seconds for real-time kitchen updates
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/kds/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return o.order_status !== 'completed' && o.order_status !== 'cancelled';
    return o.order_status === statusFilter;
  });

  const processingCount = orders.filter((o) => o.order_status === 'processing').length;
  const readyCount = orders.filter((o) => o.order_status === 'ready').length;
  const completedTodayCount = orders.filter((o) => o.order_status === 'completed').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* KDS Top Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                Layar Barista & Dapur
              </span>
            </h2>
            <span className="text-xs text-slate-400">Antrean pesanan langsung dari Terminal Kasir</span>
          </div>
        </div>

        {/* Status Filters & Counters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aktif ({processingCount + readyCount})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'processing'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span>Diproses</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                {processingCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'ready'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              <span>Siap Saji</span>
              <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.2 rounded font-mono">
                {readyCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span>Selesai ({completedTodayCount})</span>
            </button>
          </div>

          <button
            onClick={fetchOrders}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Refresh antrean tiket"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ticket Grid Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-500">
            <CheckCircle2 className="w-16 h-16 text-emerald-500/40 mb-3" />
            <h3 className="font-bold text-slate-200 text-base">Semua Pesanan Selesai Diracik</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Tidak ada antrean pesanan aktif saat ini. Tiket baru dari kasir akan muncul secara real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const elapsedMinutes = getElapsedTimeMinutes(order.created_at);
              const isUrgent = elapsedMinutes >= 15 && order.order_status === 'processing';
              const isReady = order.order_status === 'ready';
              const isProcessing = order.order_status === 'processing';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all shadow-xl ${
                    isUrgent
                      ? 'bg-slate-900 border-rose-500/60 ring-2 ring-rose-500/20'
                      : isReady
                      ? 'bg-slate-900 border-sky-500/50'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${
                      isUrgent
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : isReady
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-sm block">{order.order_number}</span>
                      <span className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                        {order.order_type === 'dine_in' ? (
                          <>
                            <Utensils className="w-3 h-3 text-emerald-400" />
                            {order.table_number || 'Dine-In'}
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 text-amber-400" />
                            Takeaway
                          </>
                        )}
                        <span>· {order.customer_name}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[11px] font-mono font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMinutes}m lalu</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatTimeOnly(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Item List */}
                  <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-56">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pb-2 border-b border-slate-800/80 last:border-b-0 space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-sm text-slate-100 leading-snug">
                            {item.quantity}x {item.product_name}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 font-medium italic">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.notes && (
                      <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg italic">
                        Pesanan: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Ticket Actions */}
                  <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 space-y-2">
                    {isProcessing && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md shadow-sky-500/20"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Siap Disajikan</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pesanan Diambil / Selesai</span>
                      </button>
                    )}

                    {order.order_status === 'completed' && (
                      <div className="text-center py-2 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pesanan Selesai</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
