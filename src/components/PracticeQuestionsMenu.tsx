'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { getModuleScore, getAllScores } from '../lib/scoreStorage' // ✅ ADDED getAllScores
import { calculatePRCRating } from '../lib/prcRating'
import ModuleAggregateBadge from '../components/ModuleAggregateBadge'

interface PracticeQuestionsMenuProps {
  userId: string
  userCoins: number
  setBUnlocked: boolean
}

const DOMAINS = [
  { code: 'abpsy',  label: 'Abnormal Psychology' },
  { code: 'devpsy', label: 'Developmental Psychology' },
  { code: 'iopsy',  label: 'Industrial / Organizational Psychology' },
  { code: 'psyas',  label: 'Psychological Assessment' },
]
const PARTS = [1, 2, 3, 4, 5]
// ✅ Must match the Practice Questions "moduleId" in MODULES (page.tsx) — used for routing + back button
const PRACTICE_MODULE_ID = 'practice_questions'

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

export default function PracticeQuestionsMenu({
  userId,
  userCoins,
  setBUnlocked,
}: PracticeQuestionsMenuProps) {
  const router = useRouter()
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // file = bare name, same style GoldenDrillsMenu uses ("batch-0.json")
  const startPart = (code: string, set: 'a' | 'b', n: number) => {
    const file = `practice-${code}-${set}${n}.json`
    router.push(`/quiz?file=${encodeURIComponent(file)}&module=${PRACTICE_MODULE_ID}`)
  }

  const handleUnlockSetB = async () => {
    if (userCoins < 40 || unlocking) return
    setUnlocking(true)
    setError(null)
    try {
      // NOTE: create this RPC by cloning unlock_golden_drills_set_b (prod only).
      // In DEV_MODE setBUnlocked is already true, so this never runs now.
      const { data, error } = await supabase.rpc('unlock_practice_questions_set_b', {
        p_user_id: userId,
        p_cost: 40,
      })
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Failed to unlock')
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to unlock Set B')
      setUnlocking(false)
    }
  }

  // ✅ GET ALL SCORES ONCE
  const allScores = getAllScores()

  const domainBlocks = (set: 'a' | 'b') =>
    DOMAINS.map((d) => (
      <div key={d.code} className="mb-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">{d.label}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PARTS.map((n) => {
            // ✅ LOOKUP SCORE FOR THIS PART
            const partKey = `practice_${set}_${d.code}_part${n}`;
            const partScore = allScores[partKey];

            return (
              <button
                key={n}
                onClick={() => startPart(d.code, set, n)}
                className={`p-3 rounded-lg border-2 text-left transition cursor-pointer ${
                  set === 'a'
                    ? 'bg-gray-900 border-teal-500 hover:border-teal-400'
                    : 'bg-gray-900 border-yellow-500 hover:border-yellow-400'
                }`}
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
      </div>
    ))

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto space-y-8 pt-20">
      <button
        onClick={() => router.push('/modules')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Modules
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-teal-400">Practice Questions</h1>
        <p className="text-gray-400">4 domains · Set A &amp; Set B · 5 parts of 100 each</p>
      </div>

       {/* AGGREGATE RATING BADGE */}
    <div className="pt-6 pb-8 flex justify-center">
      <ModuleAggregateBadge 
        moduleIdPrefix="practice_" 
        label="Practice Rating"
      />
    </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-center">
          ⚠️ {error}
        </div>
      )}

      {/* SET A — always unlocked */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">✅ Set A</h2>
        {domainBlocks('a')}
      </div>

      {/* SET B — locked or unlocked, same gate as Golden Drills */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {setBUnlocked ? '✅' : '🔒'} Set B
        </h2>
        {!setBUnlocked ? (
          <div className="p-8 bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-xl text-center space-y-4">
            <p className="text-gray-400">Finish Set A and spend 40 coins to unlock Set B</p>
            <button
              onClick={handleUnlockSetB}
              disabled={userCoins < 40 || unlocking}
              className={`px-8 py-3 rounded-lg font-bold transition ${
                userCoins >= 40
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {unlocking ? 'Unlocking...' : `🔓 Unlock for 40 Coins (${userCoins}/40)`}
            </button>
            {userCoins < 40 && (
              <p className="text-xs text-red-400">Need {40 - userCoins} more coins</p>
            )}
          </div>
        ) : (
          domainBlocks('b')
        )}
      </div>
    </div> // ✅ FIXED: Removed extra closing div from original code
  )
}