'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Eye Icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [oauthLoading, setOauthLoading] = useState(false)
  
  const router = useRouter()

  // ✅ MIGRATED PROFILE CREATION & DAILY REWARD LOGIC
  const processUserProfile = async (userId: string) => {
    try {
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
      setError('Failed to set up your account. Please try again.')
      setOauthLoading(false)
    }
  }

  // ✅ SILENT OAUTH HANDLER WITH MIGRATED LOGIC
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
        setOauthLoading(true)
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          
          if (session) {
            await processUserProfile(session.user.id)
          }
        } catch (err: any) {
          console.error('OAuth callback error:', err)
          setError('Failed to complete sign in. Please try again.')
          setOauthLoading(false)
        }
      }
    }

    handleOAuthRedirect()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        setLoading(false)
        return
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/') 
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(true)
      
      // ✅ FIX: Added prompt: 'consent' to force account picker
      // This prevents the browser from auto-selecting the previous Gmail/FB account
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            prompt: 'consent', // Forces Google/FB to always ask for account selection
          }
        }
      })
      
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setOauthLoading(false)
    }
  }

  // Show loading state during OAuth redirect
  if (oauthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-900/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-400 animate-pulse">Setting up your account...</p>
          <p className="text-gray-500 text-sm mt-2">This won't take long</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      {/* LicTech Animation Styles */}
      <style jsx global>{`
        @keyframes breathe-glow {
          0%, 100% { text-shadow: 0 0 15px rgba(45, 212, 191, 0.4); transform: scale(1); }
          50% { text-shadow: 0 0 25px rgba(45, 212, 191, 0.8); transform: scale(1.03); }
        }
        @keyframes shimmer-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .lictech-animated {
          animation: breathe-glow 3s ease-in-out infinite, shimmer-text 4s linear infinite;
          background: linear-gradient(90deg, #2dd4bf 0%, #ffffff 50%, #2dd4bf 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }
      `}</style>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
        <h2 className="text-5xl font-extrabold text-center mb-8 lictech-animated tracking-wider">
          LicTech
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-200 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition"
              placeholder="student@example.com"
            />
          </div>

          <div className="relative">
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
              <label className="block text-gray-400 text-sm mb-1">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-teal-400 hover:text-teal-300">
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900 text-gray-400">Or continue with</span></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2.5 rounded-lg transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium">Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('facebook')}
            className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 rounded-lg transition"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-sm font-medium">Facebook</span>
          </button>
        </div>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); setPassword(''); setConfirmPassword('') }}
            className="text-teal-400 hover:text-teal-300 font-medium"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>

        {/* Terms & Privacy */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-teal-400 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-teal-400 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}