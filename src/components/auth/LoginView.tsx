/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/pos.ts';
import { Coffee, ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('kasir@elexacafe.id');
  const [password, setPassword] = useState<string>('kasir123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const success = await login(email);
    if (!success) {
      setError('Email atau password tidak sesuai.');
    }
    setIsLoading(false);
  };

  const handleQuickDemoLogin = (targetRole: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    login(demoEmail, targetRole);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-8 backdrop-blur-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">ELEXA CAFE</h1>
          <p className="text-xs font-medium text-slate-400 tracking-wider uppercase">
            Point of Sale & KDS Management System
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Email Akun Staff</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@elexacafe.id"
                className="w-full h-11 pl-10 pr-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Password / PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            <span>{isLoading ? 'Memverifikasi...' : 'Masuk Ke Sistem'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-400 block text-center uppercase tracking-wider">
            Masuk Cepat Sebagai Akun Demo:
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('owner', 'owner@elexacafe.id')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-center group"
            >
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold block">Owner</span>
              <span className="text-[9px] text-slate-500 block">Akses Penuh</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('cashier', 'kasir@elexacafe.id')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-center group"
            >
              <UserCheck className="w-4 h-4 mx-auto mb-1 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold block">Kasir</span>
              <span className="text-[9px] text-slate-500 block">Terminal POS</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('kitchen', 'kitchen@elexacafe.id')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-center group"
            >
              <Coffee className="w-4 h-4 mx-auto mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold block">Barista</span>
              <span className="text-[9px] text-slate-500 block">Layar KDS</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500">
          ELEXA CAFE (Cafe & Workshop) · <span className="text-slate-400">www.elexacafe.id</span>
        </div>
      </div>
    </div>
  );
};
