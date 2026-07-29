'use client'
import { useState, useEffect } from 'react'

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only show if user hasn't seen it before
    const hasSeen = localStorage.getItem('has_seen_onboarding_v1')
    if (!hasSeen) setIsOpen(true)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('has_seen_onboarding_v1', 'true')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 border border-teal-500 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-teal-400">Welcome to BLEPP Quiz! 🎉</h2>
        
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p><strong>💰 Coin Economy:</strong> Pass quizzes to earn coins. Spend them to unlock advanced modules like Boss Drills & Preboard.</p>
          <p><strong>⏱️ Elite Timers:</strong> Preboard, Championship & Grandmaster have a strict 2-hour limit per domain. Time management is key!</p>
          <p><strong>🔀 Smart Shuffling:</strong> Questions AND answers are randomized every attempt. No memorization shortcuts allowed.</p>
          <p><strong>⭐ PRC Ratings:</strong> Your rating (#1-#10) reflects board exam readiness. Aim for #7+ to ensure you pass!</p>
        </div>

        <button 
          onClick={handleClose}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-bold transition mt-4 text-white"
        >
          Got It! Let's Study 
        </button>
      </div>
    </div>
  )
}