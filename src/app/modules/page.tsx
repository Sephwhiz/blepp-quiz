'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import ModuleAggregateBadge from '../../components/ModuleAggregateBadge'
import ErrorBoundary from '../../components/ErrorBoundary'
import { spendCoinsAndUnlock } from '../../lib/coinSystem'

// ✅ PRODUCTION-SAFE LOGGER: Only logs in development mode
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

// ✅ PRODUCTION READY: DEV MODE DISABLED
const DEV_MODE = false

const MODULES = [
  // --- FREE TIER ---
  { id: 2, name: 'Warm Up Exam', domain: 'TOS Lvl 1-2', cost: 0, moduleId: 'warm_up_exam', type: 'free' },
  // --- STARTER TIER ---
  { id: 1, name: 'Case Study', domain: 'Applied Psychology (9 Cases)', cost: 100, moduleId: 'case_study', type: 'starter' },
  { id: 0, name: 'Golden Drills', domain: 'All Domains', cost: 150, moduleId: 'golden_drills', type: 'starter' },
  // --- CORE TIER ---
  { id: 3, name: 'Boss Drills', domain: 'TOS Set A-B', cost: 200, moduleId: 'boss_drills', type: 'core' },
  { id: 4, name: 'Practice Questions', domain: 'TOS Set A-B', cost: 250, moduleId: 'practice_questions', type: 'core' },
  { id: 5, name: 'Marathon Edition', domain: '1000 Items', cost: 300, moduleId: 'marathon_edition', type: 'advanced' },
  // --- ADVANCED & ELITE TIER ---
  { id: 6, name: 'Preboard', domain: 'Easy-Med-Hard', cost: 350, moduleId: 'preboard_edition', type: 'advanced' },
  { id: 7, name: 'Championship Ed.', domain: 'TOS Mastery', cost: 400, moduleId: 'championship_edition', type: 'elite' },
  { id: 8, name: 'Grandmaster Ed.', domain: 'TOS Mastery', cost: 500, moduleId: 'grandmaster_edition', type: 'elite' },
]

export default function ModulesPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [coins, setCoins] = useState(0)
  
  const [unlockedModules, setUnlockedModules] = useState<string[]>(
    DEV_MODE ? MODULES.map(m => m.moduleId) : ['warm_up_exam']
  )
  
  const [caseStudyProgress, setCaseStudyProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ SEED FUNCTION (Only accessible when DEV_MODE = true)
  const seedAllModules = () => {
    const testScores: Record<string, any> = {}
    const domains = ['abpsy', 'devpsy', 'iopsy', 'psyas']

    domains.forEach(d => {
      testScores[`warmup_${d}_lvl1`] = { moduleId: `warmup_${d}_lvl1`, score: 22, totalQuestions: 25, rating: 8, timestamp: Date.now() }
      testScores[`warmup_${d}_lvl2`] = { moduleId: `warmup_${d}_lvl2`, score: 45, totalQuestions: 50, rating: 8, timestamp: Date.now() }
    })

    for (let i = 0; i < 8; i++) {
      testScores[`golden_drills_batch-${i}`] = { moduleId: `golden_drills_batch-${i}`, score: 75 + Math.floor(Math.random() * 20), totalQuestions: 100, rating: 7 + Math.floor(Math.random() * 3), timestamp: Date.now() }
    }

    for (let i = 1; i <= 9; i++) {
      const totalQ = i === 9 ? 16 : 24
      testScores[`case_study_${i}`] = { moduleId: `case_study_${i}`, score: Math.floor(totalQ * 0.85), totalQuestions: totalQ, rating: 8, timestamp: Date.now() }
    }

    for (let i = 1; i <= 3; i++) {
      domains.forEach(d => {
        testScores[`boss_drills_a_${d}_part${i}`] = { moduleId: `boss_drills_a_${d}_part${i}`, score: 42 + Math.floor(Math.random() * 8), totalQuestions: 50, rating: 8, timestamp: Date.now() }
      })
    }
    for (let i = 1; i <= 5; i++) {
      domains.forEach(d => {
        testScores[`boss_drills_b_${d}_part${i}`] = { moduleId: `boss_drills_b_${d}_part${i}`, score: 40 + Math.floor(Math.random() * 10), totalQuestions: 50, rating: 7, timestamp: Date.now() }
      })
    }

    for (let i = 1; i <= 5; i++) {
      domains.forEach(d => {
        testScores[`practice_a_${d}_part${i}`] = { moduleId: `practice_a_${d}_part${i}`, score: 80 + Math.floor(Math.random() * 20), totalQuestions: 100, rating: 8, timestamp: Date.now() }
        testScores[`practice_b_${d}_part${i}`] = { moduleId: `practice_b_${d}_part${i}`, score: 65 + Math.floor(Math.random() * 25), totalQuestions: 100, rating: 6, timestamp: Date.now() }
      })
    }

    for (let i = 1; i <= 10; i++) {
      testScores[`marathon_edition_part${i}`] = { moduleId: `marathon_edition_part${i}`, score: 75 + Math.floor(Math.random() * 25), totalQuestions: 100, rating: 7, timestamp: Date.now() }
    }

    const tiers = ['easy', 'medium', 'hard', 'mockboard']
    tiers.forEach(tier => {
      domains.forEach(d => {
        const totalQ = (tier === 'mockboard' || d !== 'psyas') ? 100 : 130
        testScores[`preboard_${tier}_${d}`] = { moduleId: `preboard_${tier}_${d}`, score: Math.floor(totalQ * 0.82), totalQuestions: totalQ, rating: tier === 'easy' ? 9 : tier === 'medium' ? 8 : 7, timestamp: Date.now() }
      })
    })

    domains.forEach(d => {
      testScores[`championship_${d}`] = { moduleId: `championship_${d}`, score: 78 + Math.floor(Math.random() * 22), totalQuestions: 100, rating: 8, timestamp: Date.now() }
      testScores[`grandmaster_${d}`] = { moduleId: `grandmaster_${d}`, score: 85 + Math.floor(Math.random() * 15), totalQuestions: 100, rating: 9, timestamp: Date.now() }
    })

    const currentScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    localStorage.setItem('quiz_scores', JSON.stringify({ ...currentScores, ...testScores }))
    log(`✅ Seeded ${Object.keys(testScores).length} scores!`)
    location.reload()
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/')
          return
        }
        setSession(session)

        if (!DEV_MODE) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('coins, unlocked_modules, case_study_unlocked')
            .eq('user_id', session.user.id)
            .single()
          
          if (profileError) {
            console.error('❌ Failed to load profile:', profileError)
            setError('Could not load user profile. Please try again.')
          } else if (profile) {
            setCoins(profile.coins || 0)
            setUnlockedModules(Array.isArray(profile.unlocked_modules) 
              ? profile.unlocked_modules 
              : ['warm_up_exam'])
            setCaseStudyProgress(profile.case_study_unlocked ?? 0)
          }
        } else {
          setCoins(9999)
        }
      } catch (err) {
        console.error('❌ Auth error:', err)
        setError('Authentication failed. Please log in again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleStartModule = (mod: typeof MODULES[0]) => {
    log(`🚀 Starting module: ${mod.moduleId}`)

    if (mod.moduleId === 'warm_up_exam') {
      router.push('/warmup?level=1') 
      return
    }

    if (mod.moduleId === 'case_study') {
      router.push('/case-study?id=0')
      return
    }

    if (mod.moduleId === 'golden_drills') {
      router.push('/quiz?module=golden_drills')
      return
    }

    router.push(`/quiz?module=${mod.moduleId}`)
  }

  const handleUnlockModule = async (mod: typeof MODULES[0]) => {
    if (!session?.user) {
      alert('Please log in to unlock modules')
      return
    }

    if (DEV_MODE) {
      setUnlockedModules(prev => [...prev, mod.moduleId])
      alert(`[DEV MODE] ${mod.name} unlocked instantly!`)
      return
    }

    const result = await spendCoinsAndUnlock(
      session.user.id,
      mod.cost,
      mod.moduleId
    )
    
    if (result.success) {
      setCoins(result.remaining_coins || 0)
      setUnlockedModules(prev => [...prev, mod.moduleId])
      alert(`✅ ${mod.name} unlocked! You have ${result.remaining_coins} coins left.`)
    } else {
      alert(`❌ ${result.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-teal-400 animate-pulse">Loading Modules...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
               {/* Header */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* ✅ LIC TECH LOGO */}
            <img 
              src="/logo.png" 
              alt="LicTech Logo" 
              className="h-10 w-auto object-contain" 
            />
            <h1 className="text-3xl font-bold text-teal-400">
              Module Library {DEV_MODE && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded ml-2">DEV MODE</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-yellow-400 font-bold text-xl">🪙 {coins}</span>

            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm font-medium border border-gray-700"
            >
              ← Back to Quiz
            </button>
          </div>
        </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Case Study Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Case Study Progress</span>
          <span>{caseStudyProgress} / 9 Cases Completed</span>
        </div>
        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-teal-500 h-full transition-all duration-500" 
            style={{ width: `${Math.min((caseStudyProgress / 9) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => {
          const isUnlocked = unlockedModules.includes(mod.moduleId)
          let prefix = mod.moduleId + '_'; 
          if (mod.moduleId === 'warm_up_exam') prefix = 'warmup_'; 
          if (mod.moduleId === 'golden_drills') prefix = 'golden_drills_';
          if (mod.moduleId === 'case_study') prefix = 'case_study_';
          if (mod.moduleId === 'boss_drills') prefix = 'boss_drills_';
          if (mod.moduleId === 'marathon_edition') prefix = 'marathon_'; 
          if (mod.moduleId === 'practice_questions') prefix = 'practice_'; 
          if (mod.moduleId === 'preboard_edition') prefix = 'preboard_'; 
          if (mod.moduleId === 'championship_edition') prefix = 'championship_'; 
          if (mod.moduleId === 'grandmaster_edition') prefix = 'grandmaster_';

          return (
            <button
              key={mod.id}
              onClick={() => isUnlocked ? handleStartModule(mod) : handleUnlockModule(mod)}
              disabled={!session && !isUnlocked}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                isUnlocked 
                  ? 'border-teal-500 bg-gray-900 hover:border-teal-400 cursor-pointer' 
                  : 'border-yellow-600 bg-gray-900/80 hover:border-yellow-400 cursor-pointer'
              }`}
            >
              <div className="absolute top-3 right-3">
                {isUnlocked ? (
                  <span className="text-xs bg-teal-900 text-teal-300 px-2 py-1 rounded-full">✅ Unlocked</span>
                ) : (
                  <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded-full">🪙 {mod.cost}</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{mod.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{mod.domain}</p>
              {isUnlocked && <p className="text-sm text-teal-400 mt-2">Ready to Start →</p>}

              <div className="mt-3 min-h-[1.75rem] flex items-center">
                <ErrorBoundary>
                  <ModuleAggregateBadge 
                    moduleIdPrefix={prefix} 
                    label="Rating"
                    size="sm"
                  />
                </ErrorBoundary>
              </div>
            </button>
          )
        })}
      </div>

      {/* ✅ DEV MODE SEED BUTTON (Hidden in Production) */}
      {DEV_MODE && (
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <button 
            onClick={seedAllModules}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition border border-blue-500 shadow-lg"
          >
             🚀 Seed ALL Modules (Test Scores)
          </button>
          <p className="text-xs text-gray-500 mt-2">Click to populate LocalStorage with scores for all 151 cards</p>
        </div>
      )}
            {/* ✅ FEEDBACK & SUGGESTIONS SECTION */}
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
        <h3 className="text-lg font-bold text-teal-400 mb-2">💬 Feedback & Suggestions</h3>
        <p className="text-sm text-gray-400 mb-4">
          Help us improve BLEPP Quiz! Share your thoughts about Preboard, Championship, or Grandmaster modules.
        </p>
        
        <form 
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const feedback = formData.get('feedback') as string
            
            if (!feedback.trim()) {
              alert('Please enter your feedback first!')
              return
            }
            
             // ✅ SAVE TO SUPABASE DATABASE
            const { error } = await supabase
              .from('user_feedback')
              .insert({
                user_id: session?.user?.id,
                message: feedback
              })
            
            if (error) {
              console.error('Failed to save feedback:', error)
              alert('❌ Failed to submit feedback. Please try again.')
              return
            }
            
            alert('✅ Thank you for your feedback! We appreciate your input.')
            e.currentTarget.reset()
          }}
          className="space-y-3"
        >
          <textarea
            name="feedback"
            placeholder="What would you like to see improved? Any bugs or feature requests?"
            rows={4}
            className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-none"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition"
          >
            Submit Feedback
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-3">
          Your feedback helps us make BLEPP Quiz better for all students. Thank you! 🙏
        </p>
      </div>
    </main>
  )
}