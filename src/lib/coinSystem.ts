import { supabase } from './supabase'

// ✅ EXISTING: Handle Quiz Completion & Coin Rewards
export async function handleQuizCompletion(
  userId: string,
  moduleId: string,
  scorePercentage: number
) {
  const { data, error } = await supabase.rpc('handle_user_progress', {
    p_user_id: userId,
    p_module_id: moduleId,
    p_score_percentage: scorePercentage,
    p_is_login_check: false
  })

  if (error) throw error
  return data // Returns { coins, reward_earned, unlocked_modules, login_history }
}

// ✅ EXISTING: Handle Daily Login Bonus
export async function handleDailyLogin(userId: string) {
  const { data, error } = await supabase.rpc('handle_user_progress', {
    p_user_id: userId,
    p_module_id: '',
    p_score_percentage: 0,
    p_is_login_check: true
  })

  if (error) throw error
  return data
}

// ✅ NEW: Securely Spend Coins to Unlock Modules
export interface UnlockResult {
  success: boolean
  message: string
  remaining_coins?: number
  module_id?: string
}

export async function spendCoinsAndUnlock(
  userId: string,
  cost: number,
  moduleId: string
): Promise<UnlockResult> {
  try {
    const { data, error } = await supabase.rpc('spend_coins_and_unlock', {
      p_user_id: userId,
      p_cost: cost,
      p_module_id: moduleId
    })

    if (error) {
      console.error('❌ RPC Error:', error)
      return {
        success: false,
        message: 'Failed to process transaction. Please try again.'
      }
    }
    
    // The RPC returns a JSONB object matching our UnlockResult interface
    return data as UnlockResult
    
  } catch (err) {
    console.error('❌ Unexpected error in spendCoinsAndUnlock:', err)
    return {
      success: false,
      message: 'An unexpected error occurred.'
    }
  }
}