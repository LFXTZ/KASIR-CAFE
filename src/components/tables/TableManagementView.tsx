/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import type { CafeTable, TableArea, TableStatus, Order, PaymentMethod } from '../../types/pos.ts';
import { formatRupiah, formatDateTime, getElapsedTimeMinutes } from '../../utils/formatters.ts';
import {
  Utensils,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
} from 'lucide-react';

import { fetchTablesApi, closeTableTabApi, saveLocalTables } from '../../services/storageService.ts';

interface TableManagementViewProps {
  onStartOrderForTable: (tableId: string, tableNumber: string) => void;
}

export const TableManagementView: React.FC<TableManagementViewProps> = ({ onStartOrderForTable }) => {
  const [tables, setTables] = useState<(CafeTable & { active_order?: Order | null })[]>([]);
  const [selectedArea, setSelectedArea] = useState<TableArea | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTableDetails, setSelectedTableDetails] = useState<(CafeTable & { active_order?: Order | null }) | null>(null);

  // Close Tab Payment state
  const [isSettlingTab, setIsSettlingTab] = useState<boolean>(false);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('cash');
  const [settleTendered, setSettleTendered] = useState<number>(0);
  const [settleFeedback, setSettleFeedback] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const data = await fetchTablesApi();
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    try {
      const updated = tables.map((t) =>
        t.id === tableId ? { ...t, status, current_order_id: status === 'available' ? null : t.current_order_id } : t
      );
      setTables(updated);
      saveLocalTables(updated);
      if (selectedTableDetails?.id === tableId) {
        setSelectedTableDetails(null);
      }
    } catch (err) {
      console.error('Failed to update table status:', err);
    }
  };

  const handleCloseTabSubmit = async () => {
    if (!selectedTableDetails) return;
    setIsSettlingTab(true);

    try {
      await closeTableTabApi(
        selectedTableDetails.id,
        settleMethod,
        settleTendered || selectedTableDetails.active_order?.total_amount
      );
      setSettleFeedback(`Tab Meja ${selectedTableDetails.table_number} berhasil dilunasi! Meja kembali kosong.`);
      setTimeout(() => setSettleFeedback(null), 4000);
      setSelectedTableDetails(null);
      fetchTables();
    } catch (err: any) {
      alert(err.message || 'Kesalahan saat pelunasan');
    } finally {
      setIsSettlingTab(false);
    }
  };

  const areas: (TableArea | 'all')[] = ['all', 'Indoor AC', 'Workshop Studio', 'Outdoor Terrace'];

  const filteredTables = selectedArea === 'all'
    ? tables
    : tables.filter((t) => t.area === selectedArea);

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/95 text-slate-100 overflow-hidden relative">
      {/* Toast Notification */}
      {settleFeedback && (
        <div className="absolute top-4 left-1/3 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{settleFeedback}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Manajemen Meja & Open Tab
            </h2>
            <span className="text-xs text-slate-400">
              Denah meja kafe, sistem bayar belakangan (Open Tab), dan pelunasan
            </span>
          </div>
        </div>

        {/* Area Tabs & Counts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700/60">
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedArea === area
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {area === 'all' ? 'Semua Area' : area}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {availableCount} Kosong
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {occupiedCount} Terisi / Open Tab
            </span>
          </div>

          <button
            onClick={fetchTables}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tables Floor Plan Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isReserved = table.status === 'reserved';
            const activeOrder = table.active_order;
            const elapsed = activeOrder ? getElapsedTimeMinutes(activeOrder.created_at) : 0;

            return (
              <div
                key={table.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 shadow-lg ${
                  isOccupied
                    ? 'bg-slate-900 border-amber-500/40 hover:border-amber-500 ring-1 ring-amber-500/20'
                    : isReserved
                    ? 'bg-slate-900 border-sky-500/40'
                    : 'bg-slate-800/80 border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-800'
                }`}
              >
                {/* Table Header */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100">{table.table_number}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOccupied
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isReserved
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOccupied ? 'Open Tab / Terisi' : isReserved ? 'Reservasi' : 'Tersedia'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {table.area} · Kapasitas {table.capacity} org
                  </span>
                </div>

                {/* Occupied Bill Information */}
                {isOccupied && activeOrder ? (
                  <div className="my-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                      <span className="truncate">{activeOrder.customer_name}</span>
                      <span className="font-mono text-amber-400">{activeOrder.order_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{activeOrder.items.length} item dipesan</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {elapsed}m lalu
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-bold text-emerald-400 font-mono-numbers">
                      <span>Total Tab:</span>
                      <span>{formatRupiah(activeOrder.total_amount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="my-4 py-3 flex items-center justify-center text-slate-500 text-xs italic">
                    Meja kosong, siap digunakan
                  </div>
                )}

                {/* Table Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  {isOccupied ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTableDetails(table);
                          setSettleTendered(table.active_order?.total_amount || 0);
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Pelunasan Tab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateTableStatus(table.id, 'available')}
                        title="Kosongkan Meja"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartOrderForTable(table.id, table.table_number)}
                      className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Pesanan di Meja Ini</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settle Bill / Close Tab Modal */}
      {selectedTableDetails && selectedTableDetails.active_order && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  Pelunasan Tab — {selectedTableDetails.table_number}
                </h3>
                <span className="text-xs text-slate-400">
                  Pesanan: {selectedTableDetails.active_order.order_number} ({selectedTableDetails.active_order.customer_name})
                </span>
              </div>
              <button
                onClick={() => setSelectedTableDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Itemized preview */}
            <div className="max-h-40 overflow-y-auto bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-2 text-xs">
              {selectedTableDetails.active_order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-slate-300">
                  <span>{i.quantity}x {i.product_name}</span>
                  <span className="font-mono">{formatRupiah(i.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between border border-slate-700 font-mono-numbers">
              <span className="text-xs text-slate-400">Total Tagihan:</span>
              <span className="text-xl font-bold text-emerald-400">
                {formatRupiah(selectedTableDetails.active_order.total_amount)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Pilih Metode Pelunasan:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleMethod('cash')}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                    settleMethod === 'cash'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setSettleMethod('qris')}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                    settleMethod === 'qris'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setSettleMethod('card')}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                    settleMethod === 'card'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Kartu EDC
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedTableDetails(null)}
                className="flex-1 py-3 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-700/50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSettlingTab}
                onClick={handleCloseTabSubmit}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{isSettlingTab ? 'Memproses...' : 'Tandai Lunas & Kosongkan Meja'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
