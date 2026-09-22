import { useState, useEffect, useCallback } from 'react';
import { AdminMetrics, AuditLog } from '../types';
import { StorageService } from '../services/storage';
import { apiClient } from '../services/apiClient';

// Application-layer wrapper for the admin panel's metrics + audit log, with the
// server-then-local-fallback pattern and 30s auto-refresh already used by AdminDashboard.
export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [m, l] = await Promise.all([apiClient.getAdminMetrics(), apiClient.getAuditLogs()]);
      setMetrics(m);
      setLogs(l);
    } catch {
      // Offline fallback
      setMetrics(StorageService.getAdminMetrics());
      setLogs(StorageService.getAuditLogs());
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30s as requested in TRD
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  return { metrics, logs, lastUpdated, isRefreshing, refresh };
}
