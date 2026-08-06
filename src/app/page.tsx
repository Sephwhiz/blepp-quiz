'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import StreakProgressBar from './components/StreakProgressBar'
import IntroPopup from '../components/IntroPopup' // ✅ ADDED: Import IntroPopup
import StoreModal from '../components/StoreModal' // Adjust path if needed

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState(0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isStoreOpen, setIsStoreOpen] = useState(false)
  
  const [streakData, setStreakData] = useState<{
    streak: number;
    weeklyTotal: number;
    daysRemaining: number;
  }>({ streak: 0, weeklyTotal: 0, daysRemaining: 7 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      
      // ✅ REDIRECT TO /auth IF NOT LOGGED IN
      if (!session) {
        router.replace('/auth')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session && !loading) {
        router.replace('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, loading])

   useEffect(() => {
    if (!session?.user) return;

    // ✅ EXTRACT FETCH LOGIC SO WE CAN REUSE IT
    const fetchCoins = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('coins, current_week_streak, weekly_coins_earned')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) {
        // Optional: Check for increase to trigger celebration later
        setCoins(data.coins || 0);
        const streak = data.current_week_streak || 0;
        const total = data.weekly_coins_earned || 0;
        setStreakData({
          streak,
          weeklyTotal: total,
          daysRemaining: Math.max(0, 7 - streak)
        });
      }
    };

    // 1. Fetch immediately on load
    fetchCoins();

    // 2. ✅ AUTO-REFRESH WHEN USER RETURNS TO TAB (e.g., after paying)
    const handleFocus = () => fetchCoins();
    window.addEventListener('focus', handleFocus);

    // Cleanup listener
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth') // ✅ Redirect to auth page instead of reload
  }

  // ✅ SHOW LOADING WHILE CHECKING SESSION
  if (loading || !session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-900/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-400 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6 flex flex-col items-center relative">
      {/* Header */}
      <header className="w-full max-w-md mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl font-bold text-teal-400">PsychoMetric Quiz</h1>
             <div className="flex items-center gap-2 md:gap-3">
               {/* Clickable Coin Wallet (Merged Badge + Button) */}
        <button 
  onClick={() => setIsStoreOpen(true)}
  className="flex items-center gap-1.5 bg-gray-900/80 hover:bg-gray-800 px-3 py-1.5 rounded-full border border-yellow-600/40 transition-all active:scale-95 group"
  title="Buy Coins"
>
  {/* 1. Plus Sign */}
  <span className="bg-teal-600 group-hover:bg-teal-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-colors">+</span>
  
  {/* 2. Coin Emoji */}
  <span className="text-yellow-500 text-xs">🪙</span>
  
  {/* 3. Value */}
  <span className="text-yellow-400 font-bold text-sm md:text-base">{coins}</span>
</button>

        {/* User Email (Hidden on small mobile to save space) */}
        <div className="text-xs text-gray-400 truncate max-w-[100px] hidden md:block">
          {session?.user?.email}
        </div>
      </div>
      </header>
      
      {/* Main Action Card */}
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-6 z-10">
        
        <StreakProgressBar 
          currentStreak={streakData.streak}
          weeklyTotal={streakData.weeklyTotal}
          daysRemaining={streakData.daysRemaining}
        />

        <div className="w-20 h-20 bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl"></span>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Study?</h2>
          <p className="text-gray-400">Choose a module from our library to begin your BLEPP preparation journey.</p>
        </div>

        <button 
          onClick={() => router.push('/modules')}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg transition-all active:scale-95"
        >
          Open Module Library 
        </button>

        <p className="text-xs text-gray-500 pt-4">
          Current Balance: {coins} Coins • Unlock new modules as you progress
        </p>
      </div>

      {/* Sign Out Button with Confirmation */}
      <div className="mt-8 w-full max-w-md z-10">
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

      {/* ✅ INTRO POPUP - Renders on top of everything */}
      <IntroPopup />
      {/* ✅ STORE MODAL */}
   <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
    </main>
    
  )
}