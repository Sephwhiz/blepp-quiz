'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import QuizSession from '../../components/QuizSession'
import GoldenDrillsMenu from '../components/GoldenDrillsMenu'
import WarmUpMenu from '../../components/WarmUpMenu'
import BossDrillsMenu from '../../components/BossDrillsMenu'
import PracticeQuestionsMenu from '../../components/PracticeQuestionsMenu'
import MarathonMenu from '../../components/MarathonMenu'
import PreboardMenu from '../../components/PreboardMenu'
import ChampionshipMenu from '../../components/ChampionshipMenu'
import GrandmasterMenu from '../../components/GrandmasterMenu'

// ✅ DEV MODE: Set to FALSE before launch to enable real coin locks
const DEV_MODE = true

interface UserProfile {
  coins: number
  unlocked_modules: string[]
  golden_drills_set_b_unlocked: boolean
  practice_questions_set_b_unlocked: boolean
  case_study_unlocked: number
}

// ✅ WRAP ALL LOGIC IN A SEPARATE COMPONENT TO USE SEARCHPARAMS SAFELY
function QuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filePath = searchParams.get('file') || undefined
  const moduleIdParam = searchParams.get('module') || '0'
  const levelParam = searchParams.get('level') || undefined
  const domainParam = searchParams.get('domain') || undefined

  const moduleId = isNaN(Number(moduleIdParam)) ? moduleIdParam : Number(moduleIdParam)

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [menuData, setMenuData] = useState<{
    coins: number
    setBUnlocked: boolean
  } | null>(null)

  // ✅ CASE STUDY LOCAL STATE (moved inside component)
  const [caseData, setCaseData] = useState<any>(null)

  useEffect(() => {
  const checkAccess = async () => {
    try {
      // ✅ FAILSAFE: If Supabase takes too long (offline), force load after 3 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Offline Timeout')), 3000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      
      // Race between Supabase and the Timeout
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

      if (!session) {
         // If offline and no session cached, redirect to home (or show offline msg)
         if (!navigator.onLine) {
            alert("📴 You are offline. Please connect to log in.");
            router.push('/');
            return;
         }
         router.push('/')
         return
       }
       
       setSession(session)
       
       if (DEV_MODE) {
         setIsAuthorized(true)
         setLoading(false)
         setMenuData({ coins: 9999, setBUnlocked: true })
         return
       }
       
       // ... rest of your existing profile fetch logic ...
       const { data: profile, error: fetchError } = await supabase
         .from('user_profiles')
         .select('coins, unlocked_modules, golden_drills_set_b_unlocked, practice_questions_set_b_unlocked, case_study_unlocked')
         .eq('user_id', session.user.id)
         .single()
         
       // ... handle profile error ...
       if (fetchError) {
          console.error('Failed to load profile:', fetchError)
          // Don't alert if offline, just try to proceed with cached data if possible
          if (!navigator.onLine) {
             setIsAuthorized(true); // Let them try offline
             setLoading(false);
             return;
          }
          alert(' Failed to load user data. Please refresh.')
          router.push('/')
          return
       }
       
       // ... rest of your existing unlock logic ...
       if (!profile) {
          if (!navigator.onLine) {
             setIsAuthorized(true);
             setLoading(false);
             return;
          }
          alert('❌ User profile not found. Please log in again.')
          router.push('/')
          return
       }
       
       const FREE_MODULES = ['warm_up_exam', 'golden_drills']
       const isFreeModule = typeof moduleId === 'string' && FREE_MODULES.includes(moduleId)
       const isModuleUnlocked: boolean = profile.unlocked_modules?.some(
         (id: string) => String(id) === String(moduleId)
       ) ?? false
       
       if (!isFreeModule && !isModuleUnlocked) {
          if (!navigator.onLine) {
             setIsAuthorized(true); // Assume unlocked if offline to prevent lockout
             setLoading(false);
             return;
          }
          alert('🔒 This module is locked! Please unlock it in the Module Library first.')
          router.push('/modules')
          return
       }
       
       if ((String(moduleId) === '0' || moduleId === 'golden_drills') && !filePath) {
         setMenuData({
           coins: profile.coins || 0,
           setBUnlocked: profile.golden_drills_set_b_unlocked ?? false
         })
       }
       if (moduleId === 'practice_questions' && !filePath) {
         setMenuData({
           coins: profile.coins || 0,
           setBUnlocked: profile.practice_questions_set_b_unlocked ?? false
         })
       }
       
       setIsAuthorized(true)
       setLoading(false)

    } catch (err) {
      console.error("Access check failed (likely offline):", err);
      // ✅ CRITICAL: If we are offline, let them in anyway (Graceful Degradation)
      if (!navigator.onLine) {
         setIsAuthorized(true);
         setLoading(false);
         // Set dummy menu data so UI doesn't crash
         setMenuData({ coins: 0, setBUnlocked: false }); 
      } else {
         router.push('/');
      }
    }
  }
  checkAccess()
}, [router, moduleId, filePath])

  // ✅ LOAD CASE STUDY DATA WHEN NEEDED
  useEffect(() => {
    if (String(moduleId) === 'case_study' && filePath) {
      const caseIdMatch = filePath.match(/^case-(\d+)$/)
      if (caseIdMatch) {
        const caseId = parseInt(caseIdMatch[1], 10)
        fetch('/data/case-studies.json')
          .then(res => res.json())
          .then((cases: any[]) => {
            const found = cases.find(c => c.caseId === caseId)
            setCaseData(found || null)
          })
          .catch(console.error)
      }
    }
  }, [moduleId, filePath])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-teal-400 text-xl animate-pulse">Loading...</p>
      </div>
    )
  }

  if (!session || !isAuthorized) return null

  const isGoldenDrillsMain: boolean = String(moduleId) === '0' || moduleId === 'golden_drills'
  const isWarmUpExam: boolean = moduleId === 'warm_up_exam'
  const isBossDrills: boolean = moduleId === 'boss_drills'
  const isPracticeQuestions: boolean = moduleId === 'practice_questions'
  const isMarathon: boolean = moduleId === 'marathon_edition'
  const isPreboard: boolean = moduleId === 'preboard_edition'
  const isChampionship: boolean = moduleId === 'championship_edition'
  const isGrandmaster: boolean = moduleId === 'grandmaster_edition'

  // ✅ SHARED BUTTON CLASS (Absolute positioning + Padding for spacing)
  const backBtnClass = "absolute top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"

  const PRACTICE_DOMAIN_LABELS: Record<string, string> = {
    abpsy: 'Abnormal Psychology',
    devpsy: 'Developmental Psychology',
    iopsy: 'Industrial / Organizational Psychology',
    psyas: 'Psychological Assessment',
  }

   // ✅ HELPER TO GET MODULE CONTEXT LABEL
  const getContextLabel = () => {
    // 1. GOLDEN DRILLS: Exact mapping from GoldenDrillsMenu.tsx
    if (isGoldenDrillsMain && filePath) {
      const fileName = filePath.split('/').pop() || filePath;
      const map: Record<string, string> = {
        'batch-0.json': 'AbPsy Set A', 
        'batch-2.json': 'DevPsy Set A',
        'batch-4.json': 'IOPsy Set A', 
        'batch-6.json': 'PsyAs Set A',
        'batch-1.json': 'AbPsy Set B', 
        'batch-3.json': 'DevPsy Set B',
        'batch-5.json': 'IOPsy Set B', 
        'batch-7.json': 'PsyAs Set B',
      };
      return map[fileName] || undefined;
    }

    // 2. BOSS DRILLS: Use URL params (set, domain, chunk)
    if (isBossDrills) {
      const set = searchParams.get('set') || 'A';
      const domain = PRACTICE_DOMAIN_LABELS[domainParam?.toLowerCase() || ''] || domainParam || 'Unknown Domain';
      const part = searchParams.get('chunk');
      return `${domain} - Set ${set} - Part ${part}`;
    }

    // 3. PRACTICE QUESTIONS: Parse filename (practice-abpsy-a1.json)
    if (isPracticeQuestions && filePath) {
      const match = filePath.match(/^practice-(abpsy|devpsy|iopsy|psyas)-([ab])(\d+)\.json$/);
      if (match) {
        const domain = PRACTICE_DOMAIN_LABELS[match[1]] || match[1];
        const set = match[2].toUpperCase();
        const part = match[3];
        return `${domain} - Set ${set} - Part ${part}`;
      }
    }

    // 4. PREBOARD: Parse filename (preboard-easy-abpsy.json)
    if (isPreboard && filePath) {
      const match = filePath.match(/^preboard-(easy|medium|hard|mockboard)-(abpsy|devpsy|iopsy|psyas)\.json$/);
      if (match) {
        const tier = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        const domain = PRACTICE_DOMAIN_LABELS[match[2]] || match[2];
        return `${domain} - ${tier}`;
      }
    }

    // 5. CASE STUDY: Extract case number from filename (case-study-1.json)
    if (String(moduleId) === 'case_study' && filePath) {
      const caseMatch = filePath.match(/case-study-(\d+)\.json$/);
      if (caseMatch) {
        return `Case Study #${caseMatch[1]}`;
      }
    }

    // 6. WARM UP EXAM: Existing logic preserved
    if (isWarmUpExam) {
      const lvl = levelParam === '2' ? 'Lvl 2' : 'Lvl 1';
      const dom = domainParam ? PRACTICE_DOMAIN_LABELS[domainParam.toLowerCase()] || domainParam : '';
      return dom ? `${lvl} · ${dom}` : lvl;
    }

    // 7. MARATHON: Existing logic preserved
    if (isMarathon && filePath) {
      const match = filePath.match(/marathon-card(\d+)\.json$/);
      return match ? `Part ${match[1]}` : 'Marathon';
    }

    // 8. CHAMPIONSHIP & GRANDMASTER: Existing logic preserved
    if ((isChampionship || isGrandmaster) && filePath) {
      const match = filePath.match(/(?:championship|grandmaster)-(abpsy|devpsy|iopsy|psyas)\.json$/);
      if (match) return PRACTICE_DOMAIN_LABELS[match[1]] || match[1];
    }

    return null;
  };

  const contextLabel = getContextLabel()

  // ✅ GOLDEN DRILLS MENU
  if (isGoldenDrillsMain && !filePath && menuData) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <GoldenDrillsMenu userId={session.user.id} userCoins={menuData.coins} setBUnlocked={menuData.setBUnlocked} />
      </main>
    )
  }
  
  // ✅ WARM UP MENU
  if (isWarmUpExam && !filePath) {
    const currentLevel = levelParam === '2' ? 2 : 1
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <WarmUpMenu level={currentLevel as 1 | 2} />
      </main>
    )
  }

  // ✅ BOSS DRILLS MENU
  if (isBossDrills && !filePath) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <BossDrillsMenu />
      </main>
    )
  }

  // ✅ PRACTICE QUESTIONS MENU
  if (isPracticeQuestions && !filePath && menuData) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <PracticeQuestionsMenu
          userId={session.user.id}
          userCoins={menuData.coins}
          setBUnlocked={DEV_MODE ? true : menuData.setBUnlocked}
        />
      </main>
    )
  }

  // ✅ MARATHON MENU
  if (isMarathon && !filePath) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <MarathonMenu />
      </main>
    )
  }

  // ✅ PREBOARD MENU
  if (isPreboard && !filePath) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <PreboardMenu />
      </main>
    )
  }

  // ✅ CHAMPIONSHIP MENU
  if (isChampionship && !filePath) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <ChampionshipMenu />
      </main>
    )
  }

  // ✅ GRANDMASTER MENU
  if (isGrandmaster && !filePath) {
    return (
      <main className="min-h-screen bg-gray-950 relative pt-20">
        <button onClick={() => router.push('/modules')} className={backBtnClass}>
          ← Back to Modules
        </button>
        <GrandmasterMenu />
      </main>
    )
  }

  // ✅ CASE STUDY SESSION
  if (String(moduleId) === 'case_study' && filePath) {
    const caseIdMatch = filePath.match(/^case-(\d+)$/)
    if (!caseIdMatch) {
      return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-red-400">Invalid case ID.</p>
        </main>
      )
    }

    if (!caseData) {
      return (
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-teal-400">Loading case study...</p>
        </main>
      )
    }

    const caseId = parseInt(caseIdMatch[1], 10)

    return (
      <main className="min-h-screen bg-gray-950 relative p-6 max-w-4xl mx-auto pt-20">
        <button 
          onClick={() => router.push(`/quiz?module=case_study&file=case-${caseId}`)} 
          className={backBtnClass}
        >
          ← Back to Cases
        </button>

        <div className="mb-8 p-6 bg-gray-900 rounded-xl border border-teal-900/30">
          <h2 className="text-2xl font-bold text-teal-400">{caseData.clientName}</h2>
          <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap mt-2">
            {caseData.vignette}
          </div>
        </div>

        <QuizSession
          filePath={undefined}
          batchIndex={undefined}
          session={session}
          moduleId="case_study"
          level={undefined}
          domain={undefined}
          localQuestions={caseData.questions}
        />
      </main>
    )
  }

  // ✅ STANDARD QUIZ SESSION HEADER LOGIC
  const getBackButton = () => {
    if (isGoldenDrillsMain || filePath?.includes('batch-')) {
      return { label: '← Back to Golden Drills', action: () => router.push('/quiz?module=golden_drills') }
    }
    if (isWarmUpExam) {
      return { label: '← Back to Warm Up Menu', action: () => router.push(`/warmup?level=${levelParam || '1'}`) }
    }
    if (isBossDrills) {
      return { label: '← Back to Boss Drills Menu', action: () => router.push(`/quiz?module=boss_drills&set=${searchParams.get('set') || 'A'}`) }
    }
    if (isPracticeQuestions) {
      return { label: '← Back to Practice Questions', action: () => router.push('/quiz?module=practice_questions') }
    }
    if (isMarathon) {
      return { label: '← Back to Marathon', action: () => router.push('/quiz?module=marathon_edition') }
    }
    if (isPreboard) {
      return { label: '← Back to Preboard', action: () => router.push('/quiz?module=preboard_edition') }
    }
    if (isChampionship) {
      return { label: '← Back to Championship', action: () => router.push('/quiz?module=championship_edition') }
    }
    if (isGrandmaster) {
      return { label: '← Back to Grandmaster', action: () => router.push('/quiz?module=grandmaster_edition') }
    }
    return { label: '← Back to Modules', action: () => router.push('/modules') }
  }
  const backButton = getBackButton()

  const baseName = filePath?.split('/').pop() || ''
  const practiceMatch = baseName.match(/^practice-(abpsy|devpsy|iopsy|psyas)-([ab])([1-5])\.json$/)
  const marathonMatch = baseName.match(/^marathon-card(\d+)\.json$/)
  const championshipMatch = baseName.match(/^championship-(abpsy|devpsy|iopsy|psyas)\.json$/)
  const grandmasterMatch = baseName.match(/^grandmaster-(abpsy|devpsy|iopsy|psyas)\.json$/)

  const headerTitle = practiceMatch
    ? `${PRACTICE_DOMAIN_LABELS[practiceMatch[1]]} · Set ${practiceMatch[2].toUpperCase()} · Part ${practiceMatch[3]}`
    : marathonMatch
    ? `Marathon Edition · Part ${marathonMatch[1]}`
    : championshipMatch
    ? `${PRACTICE_DOMAIN_LABELS[championshipMatch[1]]} · Championship`
    : isGrandmaster
    ? 'Grandmaster Edition'
    : null

  return (
    <main className="min-h-screen bg-gray-950 relative pt-20">
      {/* ✅ BACK BUTTON ONLY (Left Aligned) */}
      <button onClick={backButton.action} className={backBtnClass}>
        {backButton.label}
      </button>

      {/* ✅ PASS CONTEXT LABEL TO QUIZ SESSION SO IT APPEARS ABOVE PROGRESS BAR */}
      <QuizSession 
        filePath={filePath}
        batchIndex={!filePath && typeof moduleId === 'number' ? moduleId : undefined}
        session={session}
        moduleId={typeof moduleId === 'string' ? moduleId : undefined}
        level={levelParam ? parseInt(levelParam) as 1 | 2 : undefined}
        domain={domainParam}
        contextLabel={contextLabel || headerTitle || undefined}
      />
    </main>
  )
}

// ✅ EXPORT DEFAULT WITH SUSPENSE BOUNDARY
export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-teal-400 animate-pulse">
        Loading Quiz...
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}