'use client'
import { useState, useEffect } from 'react'

interface ScoreBadgeProps {
  rating: number;
  label: string;
  color: string;
  score?: number;
  totalQuestions?: number;
}

export default function ScoreBadge({ rating, label, color, score, totalQuestions }: ScoreBadgeProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${color}`}>
      <span>#{rating} {label}</span>
      {score !== undefined && totalQuestions !== undefined && (
        <span className="opacity-75">({score}/{totalQuestions})</span>
      )}
    </div>
  )
}