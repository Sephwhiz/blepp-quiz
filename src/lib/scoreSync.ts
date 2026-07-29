// src/lib/scoreSync.ts
import { supabase } from './supabase'

export interface QuizScore {
  moduleId: string
  score: number
  totalQuestions: number
  rating: number
}

// ✅ SAVE SCORE TO SUPABASE + LOCALSTORAGE
export const saveScoreToSupabase = async (scoreData: QuizScore): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.warn('⚠️ No authenticated user. Saving to LocalStorage only.')
      return false
    }

    // Upsert: Insert or Update if module already exists
    const { error } = await supabase
      .from('user_quiz_attempts')
      .upsert({
        user_id: session.user.id,
        module_id: scoreData.moduleId,
        score: scoreData.score,
        total_questions: scoreData.totalQuestions,
        rating: scoreData.rating,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,module_id' // Critical for retakes
      })

    if (error) throw error
    
    // Also update LocalStorage for instant UI feedback
    const currentScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    currentScores[scoreData.moduleId] = scoreData
    localStorage.setItem('quiz_scores', JSON.stringify(currentScores))
    
    console.log(`✅ Score synced for ${scoreData.moduleId}`)
    return true
    
  } catch (err) {
    console.error('❌ Supabase sync failed:', err)
    // Fallback: Still save to LocalStorage so user doesn't lose progress
    const currentScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    currentScores[scoreData.moduleId] = scoreData
    localStorage.setItem('quiz_scores', JSON.stringify(currentScores))
    return false
  }
}

// ✅ FETCH ALL USER SCORES FROM SUPABASE
export const fetchUserScores = async (): Promise<Record<string, QuizScore>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return {}

    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', session.user.id)

    if (error) throw error

    // Convert array to object keyed by module_id
    const scoresMap: Record<string, QuizScore> = {}
    data?.forEach((attempt: any) => {
      scoresMap[attempt.module_id] = {
        moduleId: attempt.module_id,
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        rating: attempt.rating
      }
    })

    // Merge with LocalStorage (DB takes priority)
    const localScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    const merged = { ...localScores, ...scoresMap }
    localStorage.setItem('quiz_scores', JSON.stringify(merged))
    
    return merged
    
  } catch (err) {
    console.error('❌ Failed to fetch scores:', err)
    return JSON.parse(localStorage.getItem('quiz_scores') || '{}')
  }
}