'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: string | number
  explanation?: string
  domain?: string // Optional: Add if your JSON includes domains
}

interface QuizResultsProps {
  questions: Question[]
  answers: number[]
  score: number
  coinsEarned: number
  moduleId: string
}

export default function QuizResults({ 
  questions, 
  answers, 
  score, 
  coinsEarned, 
  moduleId 
}: QuizResultsProps) {
  const router = useRouter()
  const [showReview, setShowReview] = useState(false)
  const percentage = Math.round((score / questions.length) * 100)
  const passed = percentage >= 75

  // ✅ DOMAIN BREAKDOWN CALCULATION (If domains exist in data)
  const getDomainStats = () => {
    const stats: Record<string, { correct: number; total: number }> = {}
    
    questions.forEach((q, i) => {
      const domain = q.domain || 'General'
      if (!stats[domain]) stats[domain] = { correct: 0, total: 0 }
      
      stats[domain].total++
      // Use your existing getCorrectIndex logic here or pass normalized answers
      // For simplicity, assuming answers[i] matches correct_answer index
      if (answers[i] === q.correct_answer) {
        stats[domain].correct++
      }
    })
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      percent: Math.round((data.correct / data.total) * 100),
      correct: data.correct,
      total: data.total
    }))
  }

  const domainStats = getDomainStats()

  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col items-center text-white max-w-md mx-auto">
      
      {/* Header */}
      <div className="text-center mb-8 mt-12">
        <h2 className="text-4xl font-bold mb-2">{passed ? '🎉 Passed!' : ' Keep Studying'}</h2>
        <p className="text-2xl font-mono text-teal-400">{percentage}%</p>
        <p className="text-gray-400 text-sm mt-1">{score}/{questions.length} Correct</p>
      </div>

      {/* Coin Reward Animation */}
      {passed && coinsEarned > 0 && (
        <div className="mb-8 animate-bounce-in">
          <div className="bg-gray-900 border border-yellow-500 rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
            <span className="text-2xl">🪙</span>
            <p className="text-yellow-400 font-bold text-lg">+{coinsEarned} Coins Earned!</p>
          </div>
        </div>
      )}

      {/* Domain Breakdown (Only if domains exist) */}
      {domainStats.length > 1 && (
        <div className="w-full bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Performance by Domain</h3>
          <div className="space-y-3">
            {domainStats.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{d.name}</span>
                  <span className={d.percent >= 75 ? 'text-green-400' : 'text-red-400'}>
                    {d.percent}% ({d.correct}/{d.total})
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${d.percent >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full space-y-3 mt-auto mb-8">
        <button 
          onClick={() => setShowReview(!showReview)}
          className="w-full py-4 bg-gray-800 border border-gray-700 rounded-xl font-bold hover:bg-gray-700 transition"
        >
          {showReview ? 'Hide Review' : '📖 Review Explanations'}
        </button>
        
        <button 
          onClick={() => window.location.reload()} 
          className="w-full py-4 bg-teal-600 rounded-xl font-bold hover:bg-teal-700 transition"
        >
          {passed ? 'Back to Menu' : 'Retry Module'}
        </button>
      </div>

      {/* Explanation Review Section */}
      {showReview && (
        <div className="w-full space-y-4 pb-8">
          <h3 className="text-lg font-bold text-teal-400 sticky top-0 bg-gray-950 py-2 z-10">Question Review</h3>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct_answer
            return (
              <div key={i} className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'border-green-500 bg-gray-900/50' : 'border-red-500 bg-gray-900'}`}>
                <p className="text-sm font-bold mb-2 text-gray-200">Q{i+1}: {q.question.substring(0, 60)}...</p>
                {!isCorrect && q.explanation && (
                  <p className="text-xs text-gray-400 italic leading-relaxed">💡 {q.explanation}</p>
                )}
                {isCorrect && (
                  <p className="text-xs text-green-400 font-medium">✅ Correct</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}