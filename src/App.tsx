/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { OfflineSyncProvider } from './context/OfflineSyncContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { Header, type ActiveView } from './components/common/Header.tsx';
import { PosTerminal } from './components/pos/PosTerminal.tsx';
import { TableManagementView } from './components/tables/TableManagementView.tsx';
import { KitchenDisplaySystem } from './components/kds/KitchenDisplaySystem.tsx';
import { OwnerDashboard } from './components/dashboard/OwnerDashboard.tsx';
import { LoginView } from './components/auth/LoginView.tsx';

function MainApp() {
  const { isAuthenticated, role } = useAuth();
  const { setSelectedTable } = useCart();
  const [activeView, setActiveView] = useState<ActiveView>('pos');

  // Sync default view when role switches
  useEffect(() => {
    if (role === 'kitchen') {
      setActiveView('kds');
    } else if (role === 'owner') {
      // Keep current or pos
    } else {
      setActiveView('pos');
    }
  }, [role]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleStartOrderForTable = (tableId: string, tableNumber: string) => {
    setSelectedTable(tableId, tableNumber);
    setActiveView('pos');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 3-Zone Clean Header */}
      <Header activeView={activeView} setActiveView={setActiveView} />

      {/* Main Work Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'pos' && <PosTerminal />}
        {activeView === 'tables' && (
          <TableManagementView onStartOrderForTable={handleStartOrderForTable} />
        )}
        {activeView === 'kds' && <KitchenDisplaySystem />}
        {activeView === 'dashboard' && role === 'owner' && <OwnerDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineSyncProvider>
          <CartProvider>
            <MainApp />
          </CartProvider>
        </OfflineSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
