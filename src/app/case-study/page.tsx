'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import ModuleAggregateBadge from '../../components/ModuleAggregateBadge'
import { getAllScores } from '../../lib/scoreStorage'

// ✅ SAFE SCORE BADGE COMPONENT (Inline to prevent missing file errors)
const ScoreBadge = ({ rating, score, totalQuestions }: { rating: number; score: number; totalQuestions: number }) => {
  const getColor = (r: number) => {
    if (r >= 8) return 'text-emerald-400 border-emerald-500/30 bg-emerald-900/20'
    if (r >= 6) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20'
    return 'text-red-400 border-red-500/30 bg-red-900/20'
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${getColor(rating)}`}>
      <span>#{rating}</span>
      <span className="opacity-75">({score}/{totalQuestions})</span>
    </div>
  )
}

// Define the 9 Cases exactly as they appear in your JSON
const CASES = [
  { id: 1, name: 'Mateo', domain: 'Developmental & Abnormal Psych' },
  { id: 2, name: 'Isabel', domain: 'Trauma & Burnout' },
  { id: 3, name: 'David', domain: 'PTSD & Anger Management' },
  { id: 4, name: 'Clara', domain: 'Aging & Retirement' },
  { id: 5, name: 'Javier', domain: 'Emerging Adulthood' },
  { id: 6, name: 'Sofia', domain: 'OCD & Perfectionism' },
  { id: 7, name: 'Mr. Santos', domain: 'Job Loss & Depression' },
  { id: 8, name: 'Marco & Anna', domain: 'Couples & Work-Family' },
  { id: 9, name: 'Dr. Aris', domain: 'Existential Crisis' },
]

export default function CaseStudyMenu() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session) {
          router.push('/')
          return
        }
        setSession(session)

        // We still fetch the profile to ensure the user exists, 
        // but we no longer use 'case_study_unlocked' to gate individual cards.
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('case_study_unlocked')
          .eq('user_id', session.user.id)
          .single()

      } catch (err) {
        console.error('Failed to load case study menu:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-teal-400 text-xl animate-pulse">Loading Cases...</p>
      </div>
    )
  }

  // ✅ GET ALL SCORES ONCE AT TOP LEVEL
  const allScores = getAllScores()

  // ✅ REMOVED HARD-CODED LOCKING LOGIC
  // Since the user is on this page, we assume they have access to the module.
  // All cases are now permanently unlocked for interaction.
  const isUnlocked = true 

  return (
    <main className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto pt-20">
      {/* BACK TO MODULES BUTTON */}
      <button 
        onClick={() => router.push('/modules')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Modules
      </button>

      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-teal-400">Case Studies</h1>
        <p className="text-gray-400">Complete quizzes to see your case study rating</p>
      </div>

      {/* AGGREGATE RATING BADGE */}
      <div className="flex justify-center mb-8">
        <ModuleAggregateBadge 
          moduleIdPrefix="case_study_" 
          label="Case Study Rating"
        />
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASES.map((c) => {
          // ✅ SMART KEY LOOKUP: Try ID first, then Name
          const caseKeyById = `case_study_${c.id}`
          const caseKeyByName = `case_study_${c.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`
          
          // Find score using either key format
          const caseScore = allScores[caseKeyById] || allScores[caseKeyByName]

          return (
            <button
              key={c.id}
              onClick={() => router.push(`/case-study/quiz?id=${c.id}`)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                isUnlocked 
                  ? 'border-teal-500 bg-gray-900 hover:border-teal-400 cursor-pointer group' 
                  : 'border-gray-800 bg-gray-900/30 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                {isUnlocked ? (
                  <span className="text-xs bg-teal-900/50 text-teal-300 px-2 py-1 rounded-full border border-teal-800">
                    ✅ Ready
                  </span>
                ) : (
                  <span className="text-xs bg-gray-800 text-gray-500 px-2 py-1 rounded-full border border-gray-700">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* Content */}
              <h3 className={`text-xl font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                Case {c.id}: {c.name}
              </h3>
              <p className={`text-sm ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                {c.domain}
              </p>

              {!isUnlocked && (
                <p className="text-xs text-red-400 mt-3 font-medium">
                  Complete previous case to unlock
                </p>
              )}

              {isUnlocked && (
                <p className="text-xs text-teal-500 mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start Quiz →
                </p>
              )}

              {/* ✅ INDIVIDUAL CASE SCORE BADGE */}
              {caseScore ? (
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                  <ScoreBadge 
                    rating={caseScore.rating} 
                    score={caseScore.score}
                    totalQuestions={caseScore.totalQuestions}
                  />
                </div>
              ) : (
                isUnlocked && (
                  <p className="text-xs text-gray-500 mt-4 italic">Not completed yet</p>
                )
              )}
            </button>
          )
        })}
      </div>
    </main>
  )
}