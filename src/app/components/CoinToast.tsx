'use client'

import { useEffect, useState } from 'react'

interface CoinToastProps {
  message: string
  isVisible: boolean
}

export default function CoinToast({ message, isVisible }: CoinToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 3000) // Auto-hide after 3s
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [isVisible])

  if (!visible) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-bounce-in">
      <div className="bg-gray-900 border border-yellow-500 rounded-full px-6 py-3 shadow-2xl flex items-center gap-3">
        <span className="text-2xl">🪙</span>
        <p className="text-yellow-400 font-bold text-lg whitespace-nowrap">{message}</p>
      </div>
    </div>
  )
}