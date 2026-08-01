'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('If an account exists, a reset link has been sent.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-teal-400 mb-4">Reset Password</h2>
        
        {error && <div className="mb-4 p-3 bg-red-900/30 text-red-200 rounded">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-900/30 text-green-200 rounded">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />
          <button disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <Link href="/auth" className="block text-center mt-4 text-gray-400 hover:text-white">
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}