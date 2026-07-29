'use client'
import { useRouter } from 'next/navigation'
import { getModuleScore, getAllScores } from '../lib/scoreStorage' // ✅ ADDED getAllScores
import { calculatePRCRating } from '../lib/prcRating'
import ModuleAggregateBadge from '../components/ModuleAggregateBadge'

const PARTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const MARATHON_MODULE_ID = 'marathon_edition'

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

export default function MarathonMenu() {
  const router = useRouter()

  const startPart = (n: number) => {
    const file = `marathon-card${n}.json`
    router.push(`/quiz?file=${encodeURIComponent(file)}&module=${MARATHON_MODULE_ID}`)
  }

  // ✅ GET ALL SCORES ONCE
  const allScores = getAllScores()

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto space-y-8 pt-20">
      <button
        onClick={() => router.push('/modules')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Modules
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-teal-400">Marathon Edition</h1>
        <p className="text-gray-400">1000 questions · 10 parts of 100 each</p>
      </div>

      {/* AGGREGATE RATING BADGE */}
      <div className="pt-6 pb-8 flex justify-center">
        <ModuleAggregateBadge 
          moduleIdPrefix="marathon_edition_" 
          label="Marathon Rating"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {PARTS.map((n) => {
          // ✅ LOOKUP SCORE FOR THIS PART
          const partKey = `marathon_edition_part${n}`;
          const partScore = allScores[partKey];

          return (
            <button
              key={n}
              onClick={() => startPart(n)}
              className="p-3 rounded-lg border-2 text-left transition cursor-pointer bg-gray-900 border-teal-500 hover:border-teal-400"
            >
              <div className="text-sm font-bold text-white">Part {n}</div>
              
              {/* ✅ SCORE BADGE OR PLACEHOLDER */}
              {partScore ? (
                <div className="mt-2">
                  <ScoreBadge rating={partScore.rating} score={partScore.score} total={partScore.totalQuestions} />
                </div>
              ) : (
                <div className="text-xs text-gray-400 mt-1">1–100</div>
              )}
            </button>
          );
        })}
      </div>
    </div> // ✅ FIXED: Removed extra closing div from original code
  )
}