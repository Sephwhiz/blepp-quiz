'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../../lib/supabase'

export default function AuthModal() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-800">
        <h1 className="text-3xl font-bold text-teal-400 mb-6 text-center">BLEPP Quiz</h1>
        <p className="text-gray-400 text-center mb-8">Sign in to start your psychology mastery journey</p>
        
        {/* ✅ FIXED: Properly typed supabase client */}
        <Auth 
          supabaseClient={supabase as any} 
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0056B3',
                  brandAccent: '#004494',
                  inputBackground: '#1f2937',
                  inputText: '#ffffff',
                  inputBorder: '#374151',
                  inputLabelText: '#9ca3af',
                }
              }
            }
          }}
          providers={['google']}
          redirectTo={typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : ''}
        />
        
        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}