'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // ✅ Use onAuthStateChange to reliably catch the OAuth session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      // SIGNED_IN event fires when OAuth redirect completes successfully
      if (event === 'SIGNED_IN' && session) {
        const userId = session.user.id
        
        try {
          // 1. Check if profile exists
          const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('id, coins, last_login_date')
            .eq('user_id', userId)
            .single()
          
          // 2. Create profile if missing (Fallback if trigger fails)
          if (!existingProfile && !checkError) {
            await supabase.from('user_profiles').insert({
              user_id: userId,
              coins: 0,
              current_batch: 0,
              last_login_date: new Date().toISOString().split('T')[0],
              passed_batches: [],
              unlocked_modules: [],
              total_batches_passed: 0,
              golden_drills_set_b_unlocked: false,
              login_history: [],
              case_study_unlocked: 0,
              current_week_streak: 0,
              weekly_coins_earned: 0,
              completed_cases: [],
              completed_warmup_sets: []
            })
          } 
          // 3. Handle Daily Login Reward
          else if (existingProfile) {
            const today = new Date().toISOString().split('T')[0]
            const lastLogin = existingProfile.last_login_date
            
            if (lastLogin !== today) {
              const newCoins = (existingProfile.coins || 0) + 10
              
              await supabase
                .from('user_profiles')
                .update({ 
                  coins: newCoins,
                  last_login_date: today 
                })
                .eq('user_id', userId)
              
              localStorage.setItem('dailyRewardClaimed', 'true')
            }
          }
          
          // ✅ Success! Redirect to home
          router.replace('/')
        } catch (err) {
          console.error('❌ Profile creation/update failed:', err)
          router.replace('/?error=profile_failed')
        }
      }
      
      // Handle explicit sign-out or errors
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        router.replace('/')
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-teal-400 text-xl animate-pulse">Completing sign in...</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-teal-600 rounded-lg text-white hover:bg-teal-700 transition"
        >
          Click here if stuck
        </button>
      </div>
    </div>
  )
}