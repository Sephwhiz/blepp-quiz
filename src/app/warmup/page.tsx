// src/app/warmup/page.tsx
'use client'

import { Suspense } from 'react' // ✅ ADD Suspense IMPORT
import { useSearchParams, useRouter } from 'next/navigation'
import WarmUpMenu from '../../components/WarmUpMenu'
import ModuleAggregateBadge from '../../components/ModuleAggregateBadge'

// ✅ WRAP MAIN LOGIC IN A SEPARATE COMPONENT TO USE SEARCHPARAMS SAFELY
function WarmUpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const levelParam = searchParams.get('level')

  // Default to level 1 if not specified or invalid
  const level = levelParam === '2' ? 2 : 1

  return (
    <main className="min-h-screen bg-gray-950 relative">
      {/* Back to Modules button */}
      <button
        onClick={() => router.push('/modules')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Modules
      </button>

      {/* ✅ AGGREGATE RATING BADGE - Placed above the menu */}
      <div className="pt-20 pb-6 flex justify-center">
        <ModuleAggregateBadge 
          moduleIdPrefix="warmup_" 
          level={level}
          label="Warm Up Exam Rating"
        />
      </div>

      {/* Pass level as a number, matching the interface */}
      <WarmUpMenu level={level as 1 | 2} />
    </main>
  )
}

// ✅ EXPORT DEFAULT WITH SUSPENSE BOUNDARY
export default function WarmUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-teal-400 animate-pulse">
        Loading Warm Up...
      </div>
    }>
      <WarmUpContent />
    </Suspense>
  )
}