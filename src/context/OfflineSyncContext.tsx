/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Order } from '../types/pos.ts';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulateOffline: () => void;
  pendingOfflineOrders: Order[];
  pendingCount: number;
  isSyncing: boolean;
  queueOfflineOrder: (order: Order) => void;
  syncOfflineOrders: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkOnline, setNetworkOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingOfflineOrders, setPendingOfflineOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('elexa_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isOnline = networkOnline && !isSimulatedOffline;

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save pending orders to localStorage
  useEffect(() => {
    localStorage.setItem('elexa_offline_queue', JSON.stringify(pendingOfflineOrders));
  }, [pendingOfflineOrders]);

  const queueOfflineOrder = (order: Order) => {
    const offlineOrder: Order = {
      ...order,
      sync_status: 'pending_offline',
    };
    setPendingOfflineOrders((prev) => [offlineOrder, ...prev]);
  };

  const syncOfflineOrders = async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    if (!isOnline) {
      return { success: false, syncedCount: 0, message: 'Koneksi masih offline, sinkronisasi ditunda.' };
    }
    if (pendingOfflineOrders.length === 0) {
      return { success: true, syncedCount: 0, message: 'Tidak ada transaksi pending di antrean lokal.' };
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/offline-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offline_orders: pendingOfflineOrders }),
      });

      const data = await response.json();
      if (data.success) {
        setPendingOfflineOrders([]);
        localStorage.removeItem('elexa_offline_queue');
        setIsSyncing(false);
        return {
          success: true,
          syncedCount: data.synced_count,
          message: `${data.synced_count} transaksi offline berhasil disinkronkan ke server.`,
        };
      } else {
        setIsSyncing(false);
        return { success: false, syncedCount: 0, message: data.message || 'Gagal menyinkronkan data.' };
      }
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, syncedCount: 0, message: err.message || 'Kesalahan jaringan saat sinkronisasi.' };
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOfflineOrders.length > 0 && !isSyncing) {
      syncOfflineOrders();
    }
  }, [isOnline]);

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        toggleSimulateOffline,
        pendingOfflineOrders,
        pendingCount: pendingOfflineOrders.length,
        isSyncing,
        queueOfflineOrder,
        syncOfflineOrders,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
