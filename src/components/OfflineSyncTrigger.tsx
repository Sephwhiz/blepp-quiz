// src/components/OfflineSyncTrigger.tsx
'use client'; // ✅ CRITICAL: This tells Next.js this component runs on the browser

import { useEffect } from 'react';
import { syncPendingQueue } from '@/lib/scoreStorage';

export default function OfflineSyncTrigger() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online! Triggering score sync...');
      syncPendingQueue();
    };

    // Listen for online event
    window.addEventListener('online', handleOnline);
    
    // Cleanup
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null; // Renders nothing, just runs logic
}