// src/components/OfflineBanner.tsx
'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  // Don't render anything if online
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-2 px-4 text-sm font-medium shadow-lg animate-in slide-in-from-top-5 duration-300 flex items-center justify-center gap-2">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
      <span>📴 You are offline. Scores will sync when connection returns.</span>
    </div>
  );
}