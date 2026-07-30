'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing OAuth response...')

  useEffect(() => {
    let mounted = true

    const handleAuth = async () => {
      try {
        // 1. First, try to get session directly (handles hash params)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setStatus('Error getting session. Redirecting...')
          setTimeout(() => router.replace('/?error=session_failed'), 2000)
          return
        }

        // 2. If we have a session, process it
        if (sessionData?.session) {
          setStatus('Session found! Creating profile...')
          await processUserProfile(sessionData.session.user.id)
          return
        }

        // 3. If no session yet, wait for auth state change (OAuth redirect)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return
          
          console.log('Auth event:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' && session) {
            setStatus('Signed in! Setting up profile...')
            await processUserProfile(session.user.id)
          } else if (event === 'USER_UPDATED' && session) {
            // Sometimes OAuth fires USER_UPDATED instead of SIGNED_IN
            setStatus('User updated! Setting up profile...')
            await processUserProfile(session.user.id)
          }
        })

        // 4. Fallback: If nothing happens in 10 seconds, redirect anyway
        const timeout = setTimeout(() => {
          if (mounted) {
            console.warn('Auth callback timeout - forcing redirect')
            router.replace('/?error=auth_timeout')
          }
        }, 10000)

        return () => {
          mounted = false
          clearTimeout(timeout)
          subscription.unsubscribe()
        }

      } catch (err) {
        console.error('Callback error:', err)
        setStatus('Error occurred. Redirecting...')
        setTimeout(() => router.replace('/?error=callback_failed'), 2000)
      }
    }

    handleAuth()
  }, [router])

  // Helper function to handle profile creation/update
  const processUserProfile = async (userId: string) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, coins, last_login_date')
        .eq('user_id', userId)
        .single()
      
      if (!existingProfile) {
        console.log('Creating new profile for:', userId)
        const { error: insertError } = await supabase.from('user_profiles').insert({
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
        
        if (insertError) {
          console.error('Profile insert failed:', insertError)
          // Don't block login if profile creation fails
        }
      } else {
        // Handle daily reward
        const today = new Date().toISOString().split('T')[0]
        if (existingProfile.last_login_date !== today) {
          await supabase
            .from('user_profiles')
            .update({ 
              coins: (existingProfile.coins || 0) + 10,
              last_login_date: today 
            })
            .eq('user_id', userId)
          localStorage.setItem('dailyRewardClaimed', 'true')
        }
      }
      
      // Success! Redirect to home
      router.replace('/')
      
    } catch (err) {
      console.error('Profile processing error:', err)
      router.replace('/?error=profile_failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-teal-400 text-xl animate-pulse">{status}</p>
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