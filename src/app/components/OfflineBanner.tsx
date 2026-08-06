// src/components/OfflineBanner.tsx
'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-red-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-5 duration-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>
      <span>OFFLINE MODE</span>
    </div>
  );
}