'use client'

import { handleQuizCompletion } from '../lib/coinSystem'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CollapsibleVignette from './CollapsibleVignette'
import { calculatePRCRating } from '../lib/prcRating'
import { saveModuleScore } from '../lib/scoreStorage'
import ErrorBoundary from './ErrorBoundary'
import { useQuizTimer } from '../hooks/useQuizTimer'
import { shuffleQuestionsWithAnswers, ShuffledQuestion } from '../lib/shuffleUtils'

// ✅ PRODUCTION-SAFE LOGGER: Only logs in development mode
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string | number
  explanation?: string
  domain?: string
  level?: number
}

interface QuizSessionProps {
  filePath?: string      
  batchIndex?: number    
  session: any
  moduleId?: string      
  vignette?: string      
  vignetteTitle?: string 
  initialQuestions?: Question[]
  level?: 1 | 2          
  domain?: string        
  localQuestions?: any[]
}

export default function QuizSession({ 
  filePath, 
  batchIndex, 
  session,
  moduleId = 'golden_drills',
  vignette,         
  vignetteTitle,    
  initialQuestions,
  level,
  domain,
  localQuestions,
}: QuizSessionProps) {
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeFileKey, setActiveFileKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isEliteModule = ['preboard_edition', 'championship_edition', 'grandmaster_edition'].includes(moduleId)
  
  const { 
    formattedTime, 
    progressPercent, 
    isWarning, 
    isCritical,
    isEnabled: timerEnabled 
  } = useQuizTimer({
    isEnabled: isEliteModule && score === null,
    totalSeconds: 7200, // 2 hours for elite modules
    onTimeUp: () => {
      log('⏰ TIME UP! Auto-submitting...')
      calculateScore()
    }
  })

  // ✅ CLEAN SINGLE FILE LOADING LOGIC
  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      try {
        let fileToLoad = filePath;
        
        if (fileToLoad) {
          setActiveFileKey(fileToLoad);
        }

        if (!fileToLoad) {
          if (moduleId === 'golden_drills') {
            fileToLoad = 'batch-0.json';
          } else if (typeof batchIndex === 'number') {
            fileToLoad = `batch-${batchIndex}.json`;
          } else if (moduleId === 'warm_up_exam') {
            fileToLoad = `warmup-lvl${level}-${domain?.toLowerCase()}.json`;
            log(`📁 Warm Up Target File: ${fileToLoad}`);
          } else {
            fileToLoad = 'batch-0.json';
          }
        }

        if (fileToLoad === activeFileKey && !isLoading) {
          return;
        }
        
        log(`🚀 Fetching: /data/${fileToLoad}`);
        setIsLoading(true);
        setActiveFileKey(fileToLoad);
        setLoadError(null);
        setQuestions([]);
        setCurrentQ(0);
        setAnswers([]);
        setShowExplanation(false);
        setScore(null);
        setCoinsEarned(0);

        const fullPath = moduleId === 'golden_drills' 
          ? `/data/golden-drills-fixed/${fileToLoad}` 
          : `/data/${fileToLoad}`;
          
        const res = await fetch(fullPath);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: File not found at ${fullPath}`);
        }
        
        const data: Question[] = await res.json();
        log(` Loaded ${data.length} questions`);
        
        let filteredData = data;
        if (moduleId === 'warm_up_exam' && domain) {
          filteredData = data.filter(q => 
            q.domain?.trim().toLowerCase() === domain.trim().toLowerCase()
          );
          log(`🔍 Filtered by domain '${domain}': ${data.length} → ${filteredData.length}`);
        }

        if (isMounted) {
          if (filteredData.length === 0) {
            setLoadError(`No questions found for ${domain || 'this selection'}. Check JSON file.`);
          } else {
            const shuffled = shuffleQuestionsWithAnswers(filteredData);
            setQuestions(shuffled);
            log(`🔀 Shuffled ${shuffled.length} questions and answers`);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ Failed to load quiz:', err); // Keep error logs!
          setLoadError(err instanceof Error ? err.message : 'Failed to load questions');
          setIsLoading(false);
        }
      }
    };

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [filePath, batchIndex, moduleId, level, domain]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setShowExplanation(false);
    } else {
      calculateScore();
    }
  };

  const getCorrectIndex = (q: ShuffledQuestion): number => {
    const val = q.correct_answer;
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number' && val >= 0 && val <= 3) return val;
    if (typeof val === 'number' && val > 3) return val - 1;
    
    const strVal = String(val).trim().toUpperCase();
    const map: Record<string, number> = { 
      'A': 0, 'B': 1, 'C': 2, 'D': 3,
      '1': 0, '2': 1, '3': 2, '4': 3 
    };
    return map[strVal] ?? 0;
  };

  const calculateScore = async () => {
    let correctCount = 0;
    try {
      answers.forEach((ans, i) => {
        if (ans === questions[i].mappedCorrectIndex) correctCount++;
      });
    } catch (e: any) {
      console.error('❌ Scoring error:', e);
      return;
    }

    const percentage = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    const passed = percentage >= 75;

    try {
      let uniqueId = '';
      const safeDomain = domain?.toLowerCase() || 'general';
      const safeLevel = level || 1;

      if (moduleId === 'warm_up_exam') {
        uniqueId = `warmup_${safeDomain}_lvl${safeLevel}`;
      } else if (moduleId === 'golden_drills') {
        const setPart = (window as any).currentSet?.toLowerCase() || 'a'; 
        uniqueId = `golden_drills_${safeDomain}_${setPart}`;
      } else if (moduleId === 'boss_drills') {
        const setPart = (window as any).currentSet?.toLowerCase() || 'a';
        uniqueId = `boss_drills_${setPart}_${safeDomain}`;
      } else if (moduleId === 'practice_questions') {
        const setPart = (window as any).currentSet?.toLowerCase() || 'a';
        uniqueId = `practice_${setPart}_${safeDomain}`;
      } else if (moduleId === 'case_study' || moduleId === 'case-study') {
        const caseName = activeFileKey?.replace('.json', '').replace('case-study-', '') || safeDomain;
        uniqueId = `case_study_${caseName}`;
      } else if (moduleId === 'marathon_edition') {
        const partNum = activeFileKey?.replace('marathon-cards-', '').replace('.json', '') || '1';
        uniqueId = `marathon_edition_part${partNum}`;
      } else if (moduleId === 'preboard_edition') {
        uniqueId = `preboard_lvl${safeLevel}_${safeDomain}`;
      } else if (moduleId === 'championship_edition') {
        uniqueId = `championship_${safeDomain}`;
      } else if (moduleId === 'grandmaster_edition') {
        uniqueId = `grandmaster_${safeDomain}`;
      } else {
        uniqueId = `${moduleId}_${safeDomain}`;
      }
      
      log(`💾 Saving score for: ${uniqueId}`);

      const prcResult = calculatePRCRating(correctCount, questions.length);

      saveModuleScore({
        moduleId: uniqueId,
        score: correctCount,
        totalQuestions: questions.length,
        rating: prcResult.rating,
        timestamp: Date.now()
      });
      
    } catch (err: any) {
      console.error('❌ Failed to save score:', err);
      return;
    }

    if (passed && session?.user) {
      try {
        log(' Processing coin rewards...');
        
        if (moduleId === 'case_study' || moduleId === 'case-study') {
          const urlParams = new URLSearchParams(window.location.search);
          const currentCaseIndex = parseInt(urlParams.get('id') || '0');
          
          const { data: result, error: rpcError } = await supabase.rpc('complete_case_study', {
            p_user_id: session.user.id,
            p_case_index: currentCaseIndex
          });
          if (rpcError) throw rpcError;
          setCoinsEarned(result?.reward_earned || 0);
        } 
        else if (moduleId === 'warm_up_exam') {
          const lastQuestion = questions[questions.length - 1];
          const d = lastQuestion.domain?.toLowerCase() || 'unknown';
          const setLevel = lastQuestion.level || 1;
          
          const { data: result, error: rpcError } = await supabase.rpc('complete_warmup_set', {
            p_user_id: session.user.id,
            p_domain: d,
            p_level: setLevel
          });
          if (rpcError) throw rpcError;
          setCoinsEarned(result?.reward_earned || 0);
        }
        else {
          const reward = await handleQuizCompletion(session.user.id, moduleId, percentage);
          setCoinsEarned(reward?.reward_earned || 0);
        }
      } catch (err) {
        console.error('❌ Coin reward error:', err);
        setCoinsEarned(0);
      }
    }
    
    setScore(correctCount);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Quiz</h2>
          <p className="text-gray-300 mb-4 break-all">{loadError}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition">Retry</button>
        </div>
      </div>
    );
  }

  if (isLoading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-teal-400 text-xl animate-pulse">
          {isLoading ? 'Loading Questions...' : 'No questions available.'}
        </p>
      </div>
    );
  }

   if (score !== null) {
    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
    const prcResult = calculatePRCRating(score, questions.length); 
    
    // ✅ DETERMINE CUSTOM MESSAGE BASED ON PERCENTAGE
    let customMessage = '';
    let messageColor = 'text-gray-300';
    
    if (percentage >= 90) {
      customMessage = ' Mastery Achieved';
      messageColor = 'text-yellow-400';
    } else if (percentage >= 85) {
      customMessage = '✨ Excellence in Progress';
      messageColor = 'text-teal-400';
    } else if (percentage >= 80) {
      customMessage = '💪 Growing with Confidence';
      messageColor = 'text-blue-400';
    } else if (percentage >= 75) {
      customMessage = '🌱 Every Effort Counts';
      messageColor = 'text-green-400';
    } else {
      customMessage = '📚 Your Journey Continues';
      messageColor = 'text-orange-400';
    }

    return (
      <div className="min-h-screen bg-gray-950 p-6 flex flex-col items-center justify-center text-white">
        
        {/* ✅ NEW: CUSTOM ENCOURAGING MESSAGE */}
        <h2 className={`text-3xl font-bold mb-4 ${messageColor}`}>
          {customMessage}
        </h2>
        
        {/* ✅ PRC RATING BADGE */}
        <div className={`inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-full border ${prcResult.color}`}>
          <span className="font-mono font-bold text-2xl">#{prcResult.rating}</span>
          <span className="font-semibold text-xl">{prcResult.label}</span>
        </div>
        
        <p className="mt-4 text-lg text-gray-300">
          Raw Score: {score}/{questions.length} ({Math.round(percentage)}%)
        </p>
        
        {percentage >= 75 && coinsEarned > 0 && (
          <p className="text-yellow-400 text-lg font-bold mt-4 animate-bounce">🪙 +{coinsEarned} Coins Earned!</p>
        )}
        {percentage >= 75 && coinsEarned === 0 && (
          <p className="text-gray-400 text-sm mt-4">Already completed this module. No additional coins.</p>
        )}
        
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-teal-600 rounded-lg font-bold hover:bg-teal-700 transition mt-8">
          {percentage >= 75 ? 'Back to Menu' : 'Retry'}
        </button>
      </div>
    );
  }

  const q = questions[currentQ];
  const correctIndex = q.mappedCorrectIndex;
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-950 p-4 text-white max-w-md mx-auto pt-20">
        {vignette && <CollapsibleVignette title={vignetteTitle || 'Case Study'} content={vignette} defaultOpen={true} />}

        <div className="w-full bg-gray-800 h-2 rounded-full mb-6">
          <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        
        {timerEnabled && (
          <div className={`mb-6 p-3 rounded-lg border ${
            isCritical ? 'bg-red-900/30 border-red-500 animate-pulse' : 
            isWarning ? 'bg-yellow-900/30 border-yellow-500' : 
            'bg-gray-900/50 border-gray-700'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-bold ${
                isCritical ? 'text-red-400' : 
                isWarning ? 'text-yellow-400' : 
                'text-gray-300'
              }`}>
                ⏱️ Time Remaining
              </span>
              <span className={`text-xl font-mono font-bold ${
                isCritical ? 'text-red-400' : 
                isWarning ? 'text-yellow-400' : 
                'text-teal-400'
              }`}>
                {formattedTime}
              </span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  isCritical ? 'bg-red-500' : 
                  isWarning ? 'bg-yellow-500' : 
                  'bg-teal-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-400 mb-2">Question {currentQ + 1} of {questions.length}</p>
        <h2 className="text-xl font-bold mb-6 leading-relaxed">{q.question}</h2>
        
        <div className="space-y-3 mb-6">
          {q.options.map((opt, idx) => {
            let btnClass = "border-gray-700 hover:border-teal-500 active:bg-teal-900/20";
            if (showExplanation) {
              if (idx === correctIndex) btnClass = "border-green-500 bg-green-900/30";
              else if (idx === answers[currentQ]) btnClass = "border-red-500 bg-red-900/30";
              else btnClass = "border-gray-700 opacity-50";
            }
            return (
              <button
                key={idx}
                onClick={() => !showExplanation && handleAnswer(idx)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-xl text-left border-2 transition-all ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        
        {showExplanation && q.explanation && (
          <div className="bg-gray-900 p-4 rounded-xl mb-6 border-l-4 border-teal-500">
            <p className="text-sm text-gray-300 italic leading-relaxed">{q.explanation}</p>
          </div>
        )}
        {showExplanation && !q.explanation && (
          <div className="bg-gray-900 p-4 rounded-xl mb-6 border-l-4 border-yellow-500">
            <p className="text-sm text-yellow-300 italic">No explanation available for this question.</p>
          </div>
        )}
        
        {showExplanation && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-teal-600 rounded-xl font-bold text-lg active:bg-teal-700 transition"
          >
            {currentQ < questions.length - 1 ? 'Next Question' : 'Finish Module'}
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
}