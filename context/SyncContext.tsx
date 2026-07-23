import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncAll, onSyncStateChange, getIsSyncing } from '../services/sync';
import { getSyncQueueCount, initLocalDb } from '../services/localDb';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

const SYNC_INTERVAL = 30_000; // 30 seconds
const SYNC_ON_RESUME = true;

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Initialize SQLite on mount
  useEffect(() => {
    initLocalDb();
  }, []);

  // Listen to sync state changes
  useEffect(() => {
    const unsub = onSyncStateChange(() => {
      if (mountedRef.current) {
        setIsSyncing(getIsSyncing());
        setPendingCount(getSyncQueueCount());
      }
    });
    return () => { mountedRef.current = false; unsub(); };
  }, []);

  // Network listener
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      if (mountedRef.current) setIsOnline(online);
    });
    return () => unsub();
  }, []);

  // Auto-sync when online
  const doSync = useCallback(async () => {
    if (getIsSyncing()) return;
    try {
      await syncAll();
      if (mountedRef.current) {
        setLastSyncTime(new Date().toISOString());
        setPendingCount(getSyncQueueCount());
      }
    } catch { /* silent */ }
  }, []);

  // Trigger sync on connect
  useEffect(() => {
    if (isOnline) {
      doSync();
    }
  }, [isOnline, doSync]);

  // Periodic sync
  useEffect(() => {
    if (!isOnline) {
      if (syncTimer.current) clearInterval(syncTimer.current);
      return;
    }
    syncTimer.current = setInterval(doSync, SYNC_INTERVAL);
    return () => { if (syncTimer.current) clearInterval(syncTimer.current); };
  }, [isOnline, doSync]);

  // Sync when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && SYNC_ON_RESUME) {
        doSync();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [doSync]);

  const triggerSync = useCallback(async () => {
    await doSync();
  }, [doSync]);

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount, lastSyncTime, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}

export default SyncContext;
