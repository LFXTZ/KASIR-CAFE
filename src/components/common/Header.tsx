/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useOfflineSync } from '../../context/OfflineSyncContext.tsx';
import type { UserRole } from '../../types/pos.ts';
import {
  Coffee,
  LayoutGrid,
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  ChevronDown,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { resetToDefaultData, isStaticHost } from '../../services/storageService.ts';

export type ActiveView = 'pos' | 'tables' | 'kds' | 'dashboard';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    isOnline,
    isSimulatedOffline,
    toggleSimulateOffline,
    pendingCount,
    isSyncing,
    syncOfflineOrders,
  } = useOfflineSync();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    const res = await syncOfflineOrders();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const roleLabelMap: Record<UserRole, { label: string; color: string }> = {
    owner: { label: 'Owner / Founder', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cashier: { label: 'Kasir', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
    kitchen: { label: 'Barista & Dapur', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  };

  return (
    <header className="h-16 px-3 sm:px-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-6 shrink-0 z-40 transition-colors dark:bg-slate-900/95 dark:border-slate-800 light:bg-white light:border-slate-200 w-full max-w-full overflow-x-hidden">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
          <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white dark:text-white light:text-slate-900 whitespace-nowrap block leading-tight">
            ELEXA CAFE
          </span>
          <span className="hidden sm:block text-[11px] font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 tracking-wider uppercase leading-none mt-0.5">
            Cafe & Workshop
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 rounded-xl border border-slate-700/50 dark:border-slate-700/50 light:border-slate-200">
        <button
          onClick={() => setActiveView('pos')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeView === 'pos'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Terminal Kasir
        </button>

        <button
          onClick={() => setActiveView('tables')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeView === 'tables'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Meja & Open Tab
        </button>

        <button
          onClick={() => setActiveView('kds')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeView === 'kds'
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
              : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          KDS Dapur
        </button>

        {role === 'owner' && (
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeView === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Owner Dashboard
          </button>
        )}
      </nav>

      {/* Mobile Navigation Icons */}
      <nav className="flex lg:hidden items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg border border-slate-700/50">
        <button
          onClick={() => setActiveView('pos')}
          title="Terminal Kasir"
          className={`p-2 rounded-md transition-all ${
            activeView === 'pos'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveView('tables')}
          title="Meja & Open Tab"
          className={`p-2 rounded-md transition-all ${
            activeView === 'tables'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveView('kds')}
          title="KDS Dapur"
          className={`p-2 rounded-md transition-all ${
            activeView === 'kds'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ChefHat className="w-4 h-4" />
        </button>

        {role === 'owner' && (
          <button
            onClick={() => setActiveView('dashboard')}
            title="Owner Dashboard"
            className={`p-2 rounded-md transition-all ${
              activeView === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        )}
      </nav>

      {/* Zone 3: Actions & System Status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Offline Sync Status & Simulation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSimulateOffline}
            title={isOnline ? 'Klik untuk simulasi mode OFFLINE' : 'Klik untuk kembalikan mode ONLINE'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </button>

          {pendingCount > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={!isOnline || isSyncing}
              title="Sinkronkan pesanan offline ke server"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 shadow-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} Pending</span>
            </button>
          )}
        </div>

        {/* Sync Toast Feedback */}
        {syncFeedback && (
          <div className="fixed top-18 right-5 z-50 bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg shadow-xl animate-fade-in">
            {syncFeedback}
          </div>
        )}

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${roleLabelMap[role].color}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{roleLabelMap[role].label}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-800 dark:bg-slate-800 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-200 rounded-xl shadow-2xl p-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-700/60 dark:border-slate-700/60 light:border-slate-100 text-[11px] font-medium text-slate-400">
                Ganti Akun Demo:
              </div>
              <button
                onClick={() => {
                  switchRole('owner');
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                  role === 'owner' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-700/50'
                }`}
              >
                <span>Owner (Akses Penuh)</span>
                {role === 'owner' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
              <button
                onClick={() => {
                  switchRole('cashier');
                  setActiveView('pos');
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                  role === 'cashier' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-700/50'
                }`}
              >
                <span>Kasir (Terminal POS)</span>
                {role === 'cashier' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
              <button
                onClick={() => {
                  switchRole('kitchen');
                  setActiveView('kds');
                  setRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                  role === 'kitchen' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-700/50'
                }`}
              >
                <span>Barista & Dapur (KDS)</span>
                {role === 'kitchen' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>

              <div className="pt-1.5 mt-1 border-t border-slate-700/60 dark:border-slate-700/60 light:border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Kembalikan semua katalog produk, stok, dan data ke kondisi awal default?')) {
                      resetToDefaultData();
                      window.location.reload();
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center justify-between"
                >
                  <span>Reset Data Default</span>
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          className="p-2 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Logout */}
        <button
          onClick={logout}
          title="Keluar sistem"
          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
