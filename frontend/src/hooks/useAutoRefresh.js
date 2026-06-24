import { useEffect } from 'react';
import { NETWORK_CONFIG } from '../config/network';

export const useAutoRefresh = (callback, deps = [], intervalMs = NETWORK_CONFIG.pollIntervalMs) => {
  useEffect(() => {
    callback();
    const id = window.setInterval(callback, intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
