'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getModuleScore } from '../lib/scoreStorage'
import ScoreBadge from './ScoreBadge'
import { calculatePRCRating } from '../lib/prcRating'

interface WarmUpMenuProps {
  level: 1 | 2
}

const DOMAINS = ['PsyAs', 'AbPsy', 'DevPsy', 'IOPsy']

export default function WarmUpMenu({ level }: WarmUpMenuProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get current level from props (passed by parent page)
  const currentLevel = level || 1

  const handleStartDomain = (domain: string) => {
    // ✅ FIX: Use currentLevel variable instead of hardcoded '1'
    const fileName = `warmup-lvl${currentLevel}-${domain.toLowerCase()}.json`
    
    console.log(`🚀 Starting ${domain} Level ${currentLevel}: ${fileName}`)
    
    router.push(`/quiz?file=${fileName}&module=warm_up_exam&level=${currentLevel}&domain=${domain}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto space-y-8 pt-20">
      {/* Header with Level Toggle */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-teal-400">Warm Up Exam</h1>
        
        {/* Level Switcher Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            onClick={() => router.push('/warmup?level=1')}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              currentLevel === 1 
                ? 'bg-yellow-500 text-black' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Level 1 (Fundamentals)
          </button>
          <button 
            onClick={() => router.push('/warmup?level=2')}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              currentLevel === 2 
                ? 'bg-yellow-500 text-black' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Level 2 (Advanced)
          </button>
        </div>

        <p className="text-gray-400">
          {currentLevel === 1 
            ? '25 Questions per Domain • Basic Concepts' 
            : '50 Questions per Domain • Advanced Application'}
        </p>
      </div>

              {/* Domain Cards Grid */}
                {/* Domain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOMAINS.map((domain) => {
            // ✅ GENERATE UNIQUE MODULE ID FOR SCORE LOOKUP
            const moduleId = `warmup_${domain.toLowerCase()}_lvl${currentLevel}`;
            const savedScore = getModuleScore(moduleId);

            return (
              <button
                key={domain}
                onClick={() => handleStartDomain(domain)}
                className="p-6 bg-gray-900 border-2 border-yellow-500 rounded-xl hover:border-yellow-400 transition text-left group relative"
              >
                <h3 className="text-lg font-bold text-white">{domain} - Level {currentLevel}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {currentLevel === 1 ? '25 Questions' : '50 Questions'}
                </p>

                {/* ✅ NEW: SCORE BADGE SECTION - PLACE THIS HERE */}
                {savedScore && (
                  <ScoreBadge 
                    rating={savedScore.rating}
                    label={calculatePRCRating(savedScore.score, savedScore.totalQuestions).label}
                    color={calculatePRCRating(savedScore.score, savedScore.totalQuestions).color}
                    score={savedScore.score}
                    totalQuestions={savedScore.totalQuestions}
                  />
                )}

                {!savedScore && (
                  <p className="mt-3 text-xs text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Start Quiz →
                  </p>
                )}
              </button>
            );
          })}
        </div>
    </div>
  )
}