// src/components/GrandmasterMenu.tsx
'use client'

import { useRouter } from 'next/navigation'
import { getAllScores } from '../lib/scoreStorage'
import ModuleAggregateBadge from './ModuleAggregateBadge'

const DOMAINS = [
  { code: 'abpsy', label: 'Abnormal Psychology' },
  { code: 'devpsy', label: 'Developmental Psychology' },
  { code: 'iopsy', label: 'Industrial / Organizational Psychology' },
  { code: 'psyas', label: 'Psychological Assessment' },
]

// ✅ INLINE BADGE COMPONENT (Matches Warm Up / Case Study Style)
const ScoreBadge = ({ rating, score, total }: { rating: number; score: number; total: number }) => {
  const color = rating >= 8 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20' : 
                rating >= 6 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20' : 
                'text-red-400 border-red-500/30 bg-red-900/20';
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${color}`}>
      <span>#{rating}</span>
      <span className="opacity-75">({score}/{total})</span>
    </div>
  );
};

export default function GrandmasterMenu() {
  const router = useRouter()

  const startPart = (code: string) => {
    router.push(`/quiz?file=grandmaster-${code}.json&module=grandmaster_edition`)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto pt-20">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-amber-400">Grandmaster Edition</h1>
        <p className="text-gray-400">TOS Mastery • 4 domains • Comprehensive Review</p>
      </div>

      {/* Aggregate Badge */}
      <div className="flex justify-center mb-8">
        <ModuleAggregateBadge 
          moduleIdPrefix="grandmaster_" 
          label="Grandmaster Rating"
        />
      </div>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DOMAINS.map((d) => {
          // ✅ LOOKUP SCORE FOR THIS DOMAIN
          const allScores = getAllScores();
          const domainKey = `grandmaster_${d.code}`;
          const domainScore = allScores[domainKey];

          return (
            <button
              key={d.code}
              onClick={() => startPart(d.code)}
              className="p-6 rounded-xl border-2 border-amber-500/40 bg-gray-900 hover:border-amber-400 hover:bg-amber-500/5 text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">{d.code}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{d.label}</h3>
              
              {/* ✅ CLEAN SCORE BADGE DISPLAY */}
              {domainScore ? (
                <ScoreBadge 
                  rating={domainScore.rating} 
                  score={domainScore.score} 
                  total={domainScore.totalQuestions} 
                />
              ) : (
                <p className="text-xs text-gray-500 italic">Not completed yet</p>
              )}
            </button>
          );
        })}
      </div>
    </main>
  )
}