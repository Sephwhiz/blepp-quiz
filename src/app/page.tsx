'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import AuthModal from './components/AuthModal'
import StreakProgressBar from './components/StreakProgressBar'

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState(0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false) // ✅ NEW STATE FOR CONFIRMATION
  
  // ✅ STREAK DATA STATE
  const [streakData, setStreakData] = useState<{
    streak: number;
    weeklyTotal: number;
    daysRemaining: number;
  }>({ streak: 0, weeklyTotal: 0, daysRemaining: 7 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch coins AND streak data when session loads
  useEffect(() => {
    if (session?.user) {
      supabase
        .from('user_profiles')
        .select('coins, current_week_streak, weekly_coins_earned')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCoins(data.coins || 0)
            
            // ✅ UPDATE STREAK PROGRESS BAR DATA
            const streak = data.current_week_streak || 0
            const total = data.weekly_coins_earned || 0
            setStreakData({
              streak,
              weeklyTotal: total,
              daysRemaining: Math.max(0, 7 - streak)
            })
          }
        })
    }
  }, [session])

  // ✅ HANDLE LOGOUT FUNCTION
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-teal-400 animate-pulse">Loading PsychoMetric Quiz...</p>
      </div>
    )
  }

  // ✅ FIXED: Pass required props to AuthModal to satisfy TypeScript v2
  if (!session) return <AuthModal isOpen={true} onClose={() => {}} />

  return (
    <main className="min-h-screen bg-gray-950 p-6 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-md mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-teal-400">PsychoMetric Quiz</h1>
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 font-bold">🪙 {coins}</span>
          <div className="text-xs text-gray-400 truncate max-w-[120px]">
            {session?.user?.email}
          </div>
        </div>
      </header>
      
      {/* Main Action Card */}
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-6">
        
        {/* ✅ WEEKLY STREAK PROGRESS BAR - PLACED INSIDE MAIN CARD */}
        <StreakProgressBar 
          currentStreak={streakData.streak}
          weeklyTotal={streakData.weeklyTotal}
          daysRemaining={streakData.daysRemaining}
        />

        <div className="w-20 h-20 bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">📚</span>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Study?</h2>
          <p className="text-gray-400">Choose a module from our library to begin your BLEPP preparation journey.</p>
        </div>

        <button 
          onClick={() => router.push('/modules')}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg transition-all active:scale-95"
        >
          Open Module Library →
        </button>

        <p className="text-xs text-gray-500 pt-4">
          Current Balance: {coins} Coins • Unlock new modules as you progress
        </p>
      </div>

      {/* ✅ SIGN OUT BUTTON WITH CONFIRMATION DIALOG */}
      <div className="mt-8 w-full max-w-md">
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded-xl font-medium transition-all"
          >
            Sign Out
          </button>
        ) : (
          <div className="bg-gray-900 border border-red-800 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-white font-medium">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}