/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { CafeTable, TableArea } from '../../types/pos.ts';
import { X, Table as TableIcon, Check } from 'lucide-react';

interface TablePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: CafeTable[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string, tableNumber: string) => void;
}

export const TablePickerModal: React.FC<TablePickerModalProps> = ({
  isOpen,
  onClose,
  tables,
  selectedTableId,
  onSelectTable,
}) => {
  const [selectedArea, setSelectedArea] = useState<TableArea | 'all'>('all');

  if (!isOpen) return null;

  const areas: (TableArea | 'all')[] = ['all', 'Indoor AC', 'Workshop Studio', 'Outdoor Terrace'];

  const filteredTables = selectedArea === 'all'
    ? tables
    : tables.filter((t) => t.area === selectedArea);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Pilih Meja Pelanggan</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {areas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedArea === area
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              {area === 'all' ? 'Semua Area' : area}
            </button>
          ))}
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredTables.map((tbl) => {
            const isSelected = selectedTableId === tbl.id;
            const isOccupied = tbl.status === 'occupied';

            return (
              <button
                key={tbl.id}
                type="button"
                onClick={() => {
                  onSelectTable(tbl.id, tbl.table_number);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-300'
                    : isOccupied
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-200 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{tbl.table_number}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">{tbl.area.split(' ')[0]}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      isOccupied
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isOccupied ? 'Terisi' : 'Kosong'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
