// src/hooks/useQuizTimer.ts
import { useState, useEffect, useCallback } from 'react'

interface UseQuizTimerProps {
  isEnabled: boolean          // Only true for elite modules
  totalSeconds: number        // e.g., 3600 for 60 mins
  onTimeUp: () => void        // Auto-submit callback
}

export const useQuizTimer = ({ 
  isEnabled, 
  totalSeconds, 
  onTimeUp 
}: UseQuizTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [isWarning, setIsWarning] = useState(false)
  const [isCritical, setIsCritical] = useState(false)

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Calculate progress percentage (0-100)
  const progressPercent = Math.min(
    ((totalSeconds - timeLeft) / totalSeconds) * 100, 
    100
  )

  // Handle timer tick
  useEffect(() => {
    if (!isEnabled || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeUp() // Auto-submit when time runs out
          return 0
        }
        
        // Set warning states
        if (prev <= 300) setIsCritical(true)   // Last 5 mins
        else if (prev <= 600) setIsWarning(true) // Last 10 mins
        
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isEnabled, timeLeft, onTimeUp])

  // Reset timer (for retakes)
  const resetTimer = useCallback(() => {
    setTimeLeft(totalSeconds)
    setIsWarning(false)
    setIsCritical(false)
  }, [totalSeconds])

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    progressPercent,
    isWarning,
    isCritical,
    resetTimer,
    isEnabled
  }
}