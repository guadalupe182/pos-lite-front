'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCurrentCashSession,
  isCashOpen,
  openCash as apiOpenCash,
  closeCash as apiCloseCash,
  CashSession,
  CurrentSessionDto,
  CashCloseReportDto,
} from '@/lib/api';

interface CashContextType {
  isOpen: boolean;
  session: CurrentSessionDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  openCash: (initialCash: number) => Promise<CashSession>;
  closeCash: (finalCash: number) => Promise<CashCloseReportDto>;
}

const CashContext = createContext<CashContextType | undefined>(undefined);

export function CashProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<CurrentSessionDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [open, sessionData] = await Promise.all([
        isCashOpen(),
        getCurrentCashSession(),
      ]);
      setIsOpen(open);
      setSession(sessionData || null);
    } catch (error) {
      console.error('Error refreshing cash state:', error);
      setIsOpen(false);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenCash = useCallback(async (initialCash: number) => {
    const newSession = await apiOpenCash(initialCash);
    setIsOpen(true);
    setSession(newSession);
    return newSession;
  }, []);

  const handleCloseCash = useCallback(async (finalCash: number) => {
    if (!session) throw new Error('No hay sesión de caja abierta');
    const summary = await apiCloseCash(finalCash);
    setIsOpen(false);
    setSession(null);
    return summary;
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CashContext.Provider
      value={{
        isOpen,
        session,
        loading,
        refresh,
        openCash: handleOpenCash,
        closeCash: handleCloseCash,
      }}
    >
      {children}
    </CashContext.Provider>
  );
}

export function useCash() {
  const context = useContext(CashContext);
  if (context === undefined) {
    throw new Error('useCash must be used within a CashProvider');
  }
  return context;
}