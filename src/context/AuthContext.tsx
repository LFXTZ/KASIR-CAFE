/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/pos.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  owner: {
    id: 'usr-owner-01',
    name: 'Rifqy Pratama',
    email: 'owner@elexacafe.id',
    role: 'owner',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString(),
  },
  cashier: {
    id: 'usr-cashier-01',
    name: 'Dewi Lestari',
    email: 'kasir@elexacafe.id',
    role: 'cashier',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString(),
  },
  kitchen: {
    id: 'usr-kitchen-01',
    name: 'Bima Satria',
    email: 'kitchen@elexacafe.id',
    role: 'kitchen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('elexa_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USERS.cashier;
      }
    }
    // Default logged in as Cashier for instant POS usage
    return DEFAULT_USERS.cashier;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('elexa_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('elexa_user');
    }
  }, [user]);

  const login = async (email: string, targetRole?: UserRole): Promise<boolean> => {
    try {
      const roleToUse: UserRole = targetRole || (email.includes('owner') ? 'owner' : email.includes('kitchen') ? 'kitchen' : 'cashier');
      const selectedUser = DEFAULT_USERS[roleToUse] || DEFAULT_USERS.cashier;
      setUser(selectedUser);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    setUser(DEFAULT_USERS[newRole]);
  };

  const role = user?.role || 'cashier';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
