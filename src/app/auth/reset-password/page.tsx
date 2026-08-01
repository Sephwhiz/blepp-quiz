'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is actually in a recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If no session, redirect back to forgot password or login
        router.push('/auth/forgot-password')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      setError(error.message)
    } else {
      alert('Password updated successfully!')
      router.push('/auth')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-teal-400 mb-4">Set New Password</h2>
        {error && <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />
          <button disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}