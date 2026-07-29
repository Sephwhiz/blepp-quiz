'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getModuleScore, getAllScores } from '../../lib/scoreStorage' // ✅ ADDED getAllScores
import { calculatePRCRating } from '../../lib/prcRating'
import ModuleAggregateBadge from '../../components/ModuleAggregateBadge'

interface GoldenDrillsMenuProps {
  userId: string
  userCoins: number
  setBUnlocked: boolean
}

const GOLDEN_DRILLS_ITEMS = [
  // SET A (Always Unlocked)
  { id: 'gd-setA-abpsy', label: 'AbPsy Set A', file: 'batch-0.json', domain: 'AbPsy', set: 'A' },
  { id: 'gd-setA-devpsy', label: 'DevPsy Set A', file: 'batch-2.json', domain: 'DevPsy', set: 'A' },
  { id: 'gd-setA-iopsy', label: 'IOPsy Set A', file: 'batch-4.json', domain: 'IOPsy', set: 'A' },
  { id: 'gd-setA-psyas', label: 'PsyAs Set A', file: 'batch-6.json', domain: 'PsyAs', set: 'A' },
  
  // SET B (Locked Behind 40 Coins)
  { id: 'gd-setB-abpsy', label: 'AbPsy Set B', file: 'batch-1.json', domain: 'AbPsy', set: 'B' },
  { id: 'gd-setB-devpsy', label: 'DevPsy Set B', file: 'batch-3.json', domain: 'DevPsy', set: 'B' },
  { id: 'gd-setB-iopsy', label: 'IOPsy Set B', file: 'batch-5.json', domain: 'IOPsy', set: 'B' },
  { id: 'gd-setB-psyas', label: 'PsyAs Set B', file: 'batch-7.json', domain: 'PsyAs', set: 'B' },
]

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

export default function GoldenDrillsMenu({
  userId,
  userCoins,
  setBUnlocked
}: GoldenDrillsMenuProps) {
  const router = useRouter()
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartQuiz = (file: string) => {
    console.log(`🚀 Starting quiz with file: ${file}`)
    router.push(`/quiz?file=${encodeURIComponent(file)}&module=golden_drills`) // ✅ FIXED MODULE ID
  }

  const handleUnlockSetB = async () => {
    if (userCoins < 40 || unlocking) return
    
    setUnlocking(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('unlock_golden_drills_set_b', {
        p_user_id: userId,
        p_cost: 40
      })
      
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to unlock")
      }
      
      window.location.reload()
      
    } catch (err: any) {
      setError(err.message || "Failed to unlock Set B")
      setUnlocking(false)
    }
  }

  const setAItems = GOLDEN_DRILLS_ITEMS.filter(i => i.set === 'A')
  const setBItems = GOLDEN_DRILLS_ITEMS.filter(i => i.set === 'B')

  // ✅ GET ALL SCORES ONCE
  const allScores = getAllScores()

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto space-y-8 pt-20">
      {/* BACK TO MODULES BUTTON */}
      <button
        onClick={() => router.push('/modules')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Modules
      </button>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-teal-400">Golden Drills</h1>
        <p className="text-gray-400">Master fundamentals before advancing</p>
      </div>

      {/* AGGREGATE RATING BADGE */}
      <div className="pt-6 pb-8 flex justify-center">
        <ModuleAggregateBadge 
          moduleIdPrefix="golden_drills_" 
          label="Golden Drills Rating"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-center">
          ⚠️ {error}
        </div>
      )}

      {/* SET A - Always Unlocked */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ✅ Set A (Fundamentals)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setAItems.map(item => {
            // ✅ LOOKUP SCORE FOR SET A
            const itemKey = `golden_drills_${item.file.replace('.json', '')}`;
            const itemScore = allScores[itemKey];

            return (
              <button
                key={item.id}
                onClick={() => handleStartQuiz(item.file)}
                className="p-6 bg-gray-900 border-2 border-teal-500 rounded-xl hover:border-teal-400 transition text-left group cursor-pointer w-full"
              >
                <h3 className="text-lg font-bold text-white">{item.label}</h3>
                <p className="text-sm text-gray-400 mt-1">100 Questions</p>
                
                {/* ✅ SCORE BADGE OR PLACEHOLDER */}
                {itemScore ? (
                  <div className="mt-3">
                    <ScoreBadge rating={itemScore.rating} score={itemScore.score} total={itemScore.totalQuestions} />
                  </div>
                ) : (
                  <p className="text-xs text-teal-400 mt-3 opacity-0 group-hover:opacity-100 transition">Start Quiz →</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SET B - Locked or Unlocked */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {setBUnlocked ? '✅' : '🔒'} Set B (Advanced)
        </h2>
        
        {!setBUnlocked ? (
          <div className="p-8 bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-xl text-center space-y-4">
            <p className="text-gray-400">Complete Set A and spend 40 coins to unlock advanced drills</p>
            <button
              onClick={handleUnlockSetB}
              disabled={userCoins < 40 || unlocking}
              className={`px-8 py-3 rounded-lg font-bold transition ${
                userCoins >= 40
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {unlocking ? 'Unlocking...' : ` Unlock for 40 Coins (${userCoins}/40)`}
            </button>
            {userCoins < 40 && (
              <p className="text-xs text-red-400">Need {40 - userCoins} more coins</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setBItems.map(item => {
              // ✅ LOOKUP SCORE FOR SET B
              const itemKey = `golden_drills_${item.file.replace('.json', '')}`;
              const itemScore = allScores[itemKey];

              return (
                <button
                  key={item.id}
                  onClick={() => handleStartQuiz(item.file)}
                  className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-xl hover:border-yellow-400 transition text-left group cursor-pointer w-full"
                >
                  <h3 className="text-lg font-bold text-white">{item.label}</h3>
                  <p className="text-sm text-gray-400 mt-1">100 Questions</p>
                  
                  {/* ✅ SCORE BADGE OR PLACEHOLDER */}
                  {itemScore ? (
                    <div className="mt-3">
                      <ScoreBadge rating={itemScore.rating} score={itemScore.score} total={itemScore.totalQuestions} />
                    </div>
                  ) : (
                    <p className="text-xs text-yellow-400 mt-3 opacity-0 group-hover:opacity-100 transition">Start Quiz →</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div> // ✅ FIXED: Removed extra closing div from original code
  )
}