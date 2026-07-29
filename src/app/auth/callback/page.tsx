'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ✅ PRODUCTION-SAFE LOGGER: Only logs in development mode
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Auth callback error:', error.message)
          router.replace('/')
          return
        }
        
        if (data?.session) {
          const userId = data.session.user.id
          
          // Check if profile exists
          const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('id, coins, last_login_date')
            .eq('user_id', userId)
            .single()
          
          if (!existingProfile && !checkError) {
            log(' Creating new profile for user...')
            await supabase.from('user_profiles').insert({
              user_id: userId,
              coins: 0,
              current_batch: 0,
              last_login_date: new Date().toISOString().split('T')[0]
            })
          } else if (existingProfile) {
            // ✅ CHECK DAILY LOGIN REWARD
            const today = new Date().toISOString().split('T')[0]
            const lastLogin = existingProfile.last_login_date
            
            if (lastLogin !== today) {
              log('🎁 Daily login reward claimed')
              
              const newCoins = (existingProfile.coins || 0) + 10
              
              await supabase
                .from('user_profiles')
                .update({ 
                  coins: newCoins,
                  last_login_date: today 
                })
                .eq('user_id', userId)
              
              // Store reward flag in localStorage so home page can show notification
              localStorage.setItem('dailyRewardClaimed', 'true')
            }
          }
          
          router.replace('/')
        } else {
          log('⚠️ No session found on callback, redirecting to home')
          router.replace('/')
        }
      } catch (err) {
        console.error('❌ Unexpected auth callback error:', err)
        router.replace('/')
      }
    }

    handleCallback()
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