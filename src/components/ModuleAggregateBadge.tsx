'use client'
import { useState, useEffect } from 'react'
import { getAllScores } from '../lib/scoreStorage'
import { getAggregateModuleRating } from '../lib/prcRating'

interface ModuleAggregateBadgeProps {
  moduleIdPrefix: string
  level?: number
  label?: string
  size?: 'sm' | 'md'
}

export default function ModuleAggregateBadge({ 
  moduleIdPrefix, 
  level,
  label = 'Rating',
  size = 'md'
}: ModuleAggregateBadgeProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [scores, setScores] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true)
    
    const allScores = Object.values(getAllScores())
    let filtered = allScores.filter(s => s.moduleId.startsWith(moduleIdPrefix))
    
    if (level !== undefined) {
      filtered = filtered.filter(s => s.moduleId.includes(`lvl${level}`))
    }
    
    setScores(filtered)
  }, [moduleIdPrefix, level])

  if (!isMounted) return null

  const aggregate = getAggregateModuleRating(scores)

  // ✅ DYNAMIC STYLING BASED ON PERFORMANCE
  const getBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
    if (percentage >= 80) return 'bg-teal-900/30 border-teal-500 text-teal-400'
    if (percentage >= 70) return 'bg-yellow-900/30 border-yellow-500 text-yellow-400'
    return 'bg-red-900/30 border-red-500 text-red-400'
  }

  const baseClasses = "inline-flex items-center gap-2 rounded-full border font-bold"
  const sizeClasses = size === 'sm' 
    ? "px-3 py-1 text-xs" 
    : "px-5 py-2 text-lg"

  if (!aggregate) {
    return (
      <p className={`${sizeClasses} text-gray-500 italic`}>
        Complete quizzes to see your {label.toLowerCase()}
      </p>
    )
  }

  const badgeColor = getBadgeColor(aggregate.percentage)

  return (
    <div className={`${baseClasses} ${sizeClasses} ${badgeColor}`}>
      <span>{label}:</span>
      {/* ✅ SHOW PERCENTAGE AS MAIN METRIC */}
      <span>{aggregate.percentage}%</span>
      
      {/* Optional: Keep label for context on larger badges */}
      {size !== 'sm' && (
        <span className="opacity-75 text-sm font-normal">
          ({aggregate.label})
        </span>
      )}
    </div>
  )
}