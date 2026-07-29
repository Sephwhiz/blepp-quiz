'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import CoinToast from '../components/CoinToast'

export default function LoginBonusChecker() {
  const [checked, setChecked] = useState(false)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const checkLogin = async () => {
      if (checked) return
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          setChecked(true)
          return
        }

        const { data: result, error: rpcError } = await supabase.rpc('claim_daily_login_bonus', {
          p_user_id: session.user.id
        })

        if (rpcError) {
          console.error('Weekly Bonus RPC Error:', rpcError.message)
        } else if (result?.reward_earned > 0) {
          // ✅ BUILD DYNAMIC TOAST MESSAGE
          let msg = `+${result.reward_earned} Coins!`
          if (result.streak) msg += ` (Day ${result.streak}/7)`
          if (result.streak_bonus) msg += ` 🔥 Streak Bonus!`
          if (result.monthly_bonus) msg += ` 📅 Monthly Bonus!`
          
          setToastMessage(msg)
          setShowToast(true)
        }
        
      } catch (err: any) {
        console.error('Unexpected login bonus error:', err?.message || err)
      } finally {
        setChecked(true)
      }
    }

    checkLogin()
  }, [checked])

  return (
    <>
      {/* ✅ RENDER TOAST ONLY WHEN REWARD IS EARNED */}
      <CoinToast 
        message={toastMessage} 
        isVisible={showToast} 
      />
      {/* Renders nothing visually otherwise */}
    </>
  )
}