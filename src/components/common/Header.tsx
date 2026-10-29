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
  UserCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { resetToDefaultData } from '../../services/storageService.ts';

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
    toggleSimulateOffline,
    pendingCount,
    isSyncing,
    syncOfflineOrders,
  } = useOfflineSync();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    const res = await syncOfflineOrders();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  return (
    <header className="w-full max-w-full flex flex-col shrink-0 z-30 transition-colors bg-slate-900 dark:bg-slate-900 light:bg-white border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
      {/* ========================================================= */}
      {/* ROW 1: NAVBAR UTAMA (Logo Elexa Cafe & Ikon Navigasi)     */}
      {/* ========================================================= */}
      <div className="h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 w-full">
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
            type="button"
            onClick={() => setActiveView('pos')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeView === 'pos'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Terminal Kasir
          </button>

          <button
            type="button"
            onClick={() => setActiveView('tables')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeView === 'tables'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Meja & Open Tab
          </button>

          <button
            type="button"
            onClick={() => setActiveView('kds')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeView === 'kds'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            KDS Dapur
          </button>

          {role === 'owner' && (
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeView === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
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
            type="button"
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
            type="button"
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
            type="button"
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
              type="button"
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
              type="button"
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
                type="button"
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

          {/* Dark/Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            className="p-2 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Logout */}
          <button
            type="button"
            onClick={logout}
            title="Keluar sistem"
            className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="fixed top-20 right-5 z-50 bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg shadow-xl animate-fade-in">
          {syncFeedback}
        </div>
      )}

      {/* ========================================================= */}
      {/* ROW 2: BANNER TEKS "GANTI AKUN DEMO" (IN-FLOW FLEXBOX)    */}
      {/* Non-overlapping, pure in-flow layout, touchscreen-ready   */}
      {/* ========================================================= */}
      <div className="w-full bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-100 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left Side: Role Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold pr-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap">Ganti Akun Demo:</span>
          </div>

          <button
            type="button"
            onClick={() => switchRole('owner')}
            className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              role === 'owner'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800/70 dark:bg-slate-800/70 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 hover:text-white dark:hover:text-white hover:border-slate-600'
            }`}
          >
            <span>Owner (Akses Penuh)</span>
            {role === 'owner' && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
          </button>

          <button
            type="button"
            onClick={() => {
              switchRole('cashier');
              setActiveView('pos');
            }}
            className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              role === 'cashier'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800/70 dark:bg-slate-800/70 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 hover:text-white dark:hover:text-white hover:border-slate-600'
            }`}
          >
            <span>Kasir (Terminal POS)</span>
            {role === 'cashier' && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
          </button>

          <button
            type="button"
            onClick={() => {
              switchRole('kitchen');
              setActiveView('kds');
            }}
            className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              role === 'kitchen'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800/70 dark:bg-slate-800/70 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 hover:text-white dark:hover:text-white hover:border-slate-600'
            }`}
          >
            <span>Barista & Dapur (KDS)</span>
            {role === 'kitchen' && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
          </button>
        </div>

        {/* Right Side: Reset Data Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Kembalikan semua katalog produk, stok, dan data ke kondisi awal default?')) {
                resetToDefaultData();
                window.location.reload();
              }
            }}
            className="min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-400 dark:text-amber-400 light:text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 transition-colors flex items-center gap-1.5"
            title="Reset katalog produk, meja, dan riwayat pesanan ke data awal"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Data Default</span>
          </button>
        </div>
      </div>
    </header>
  );
};
