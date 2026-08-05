'use client'

import { useState } from 'react' // ✅ ADDED useState FOR CLIENT-SIDE TOGGLE
import { useRouter } from 'next/navigation'
import { getAllScores } from '../lib/scoreStorage'
import ModuleAggregateBadge from '../components/ModuleAggregateBadge'

const DOMAINS = ['PsyAs', 'AbPsy', 'DevPsy', 'IOPsy']

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

export default function BossDrillsMenu() {
  const router = useRouter()

  // ✅ CLIENT-SIDE STATE FOR SET TOGGLE (NO ROUTER.PUSH NEEDED)
  const [currentSet, setCurrentSet] = useState<'A' | 'B'>('A')
  
  const chunkCount = currentSet === 'A' ? 3 : 5
  const fileSet = `set${currentSet}`

  const handleStart = (domain: string, part: number) => {
    const file = `boss-drills-${fileSet}-${domain.toLowerCase()}-${part}.json`
    console.log(` Boss Drills → ${file}`)
    router.push(
      `/quiz?file=${file}&module=boss_drills&domain=${domain}&set=${currentSet}&chunk=${part}`
    )
  }

  // ✅ GET ALL SCORES ONCE
  const allScores = getAllScores()

    return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-5xl mx-auto space-y-8 pt-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-teal-400">Boss Drills</h1>

        {/* ✅ FIXED: USE STATE TOGGLE INSTEAD OF ROUTER.PUSH */}
        <div className="flex justify-center gap-4 mb-2">
          <button
            onClick={() => setCurrentSet('A')} // ✅ CHANGED FROM router.push
            className={`px-6 py-2 rounded-lg font-bold transition ${
              currentSet === 'A'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
            }`}
          >
            Set A (150 / domain)
          </button>
          <button
            onClick={() => setCurrentSet('B')} // ✅ CHANGED FROM router.push
            className={`px-6 py-2 rounded-lg font-bold transition ${
              currentSet === 'B'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Set B (250 / domain)
          </button>
        </div>

         {/* AGGREGATE RATING BADGE */}
           <div className="pt-6 pb-8 flex justify-center">
            <ModuleAggregateBadge 
           moduleIdPrefix="boss_drills_" 
           label="Boss Drills Rating"
            />
         </div>

        <p className="text-gray-400">
          {currentSet === 'A'
            ? '3 parts × 50 questions per domain'
            : '5 parts × 50 questions per domain'}
        </p>
      </div>

      {/* One section per domain, each showing its part cards */}
      <div className="space-y-8">
        {DOMAINS.map((domain) => (
          <div key={domain} className="space-y-3">
            <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-1">
              {domain} <span className="text-gray-500 text-sm">— Set {currentSet}</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: chunkCount }, (_, i) => i + 1).map((part) => {
                // ✅ LOOKUP SCORE FOR THIS PART
                const partKey = `boss_drills_${currentSet.toLowerCase()}_${domain.toLowerCase()}_part${part}`;
                const partScore = allScores[partKey];

                return (
                  <button
                    key={part}
                    onClick={() => handleStart(domain, part)}
                    className="p-4 bg-gray-900 border-2 border-yellow-500 rounded-xl hover:border-yellow-400 transition text-left group cursor-pointer w-full"
                  >
                    <h3 className="text-base font-bold text-white">Part {part}</h3>
                    <p className="text-xs text-gray-400 mt-1">50 Questions</p>
                    
                    {/* ✅ SCORE BADGE OR PLACEHOLDER */}
                    {partScore ? (
                      <div className="mt-2">
                        <ScoreBadge rating={partScore.rating} score={partScore.score} total={partScore.totalQuestions} />
                      </div>
                    ) : (
                      <p className="text-xs text-yellow-400 mt-2 opacity-0 group-hover:opacity-100 transition">Start →</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}