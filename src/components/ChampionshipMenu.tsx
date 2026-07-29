'use client'
import { useRouter } from 'next/navigation'
import { getModuleScore, getAllScores } from '../lib/scoreStorage' // ✅ ADDED getAllScores
import { calculatePRCRating } from '../lib/prcRating'
import ModuleAggregateBadge from '../components/ModuleAggregateBadge'

const DOMAINS = [
  { code: 'abpsy', label: 'Abnormal Psychology', short: 'ABPSY' },
  { code: 'devpsy', label: 'Developmental Psychology', short: 'DEVPSY' },
  { code: 'iopsy', label: 'Industrial / Organizational', short: 'IOPSY' },
  { code: 'psyas', label: 'Psychological Assessment', short: 'PSYAS' },
] as const

// ✅ INLINE BADGE COMPONENT
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

export default function ChampionshipMenu() {
  const router = useRouter()
  
  // ✅ GET ALL SCORES ONCE
  const allScores = getAllScores()

  const start = (code: string) =>
    router.push(`/quiz?file=${encodeURIComponent('championship-' + code + '.json')}&module=championship_edition`)

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto space-y-8 pt-20">
      <button
        onClick={() => router.push('/modules')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Modules
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-amber-400">Championship Edition</h1>
        <p className="text-gray-400">TOS Mastery · 4 domains · 100 questions each</p>
      </div>

       {/* AGGREGATE RATING BADGE */}
      <div className="pt-6 pb-8 flex justify-center">
        <ModuleAggregateBadge 
          moduleIdPrefix="championship_" 
          label="Championship Rating"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DOMAINS.map((d) => {
          // ✅ LOOKUP SCORE FOR THIS DOMAIN
          const domainKey = `championship_${d.code}`;
          const domainScore = allScores[domainKey];

          return (
            <button
              key={d.code}
              onClick={() => start(d.code)}
              className="p-6 rounded-xl border-2 border-amber-500/40 bg-gray-900 hover:border-amber-400 hover:bg-amber-500/5 text-left transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-gray-500">{d.short}</span>
                <span className="text-xs text-amber-300/70">100 Q</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2">{d.label}</h3>
              
              {/* ✅ SCORE BADGE OR PLACEHOLDER */}
              {domainScore ? (
                <div className="mt-3">
                  <ScoreBadge rating={domainScore.rating} score={domainScore.score} total={domainScore.totalQuestions} />
                </div>
              ) : (
                <p className="text-sm text-amber-400 mt-3 opacity-0 group-hover:opacity-100 transition">Start drill →</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  )
}