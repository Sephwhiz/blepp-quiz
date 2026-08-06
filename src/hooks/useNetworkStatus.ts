// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkConnection = async () => {
      // ✅ REAL CHECK: Try to fetch a tiny resource
      try {
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    const handleOnline = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkConnection, 500); // Small delay to avoid false positives
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial real check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
    };
  }, []);

  return isOnline;
}