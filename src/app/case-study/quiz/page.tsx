'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import caseStudiesData from '../../../../public/data/case-studies.json'
import CollapsibleVignette from '../../../components/CollapsibleVignette'
import { calculatePRCRating } from '../../../lib/prcRating' // ✅ ADD THIS
import { saveModuleScore } from '../../../lib/scoreStorage'   // ✅ ADD THIS

export default function CaseStudyQuizPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const caseId = parseInt(searchParams.get('id') || '0')

  const [caseData, setCaseData] = useState<any>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    const found = caseStudiesData.find(c => c.caseId === caseId)
    if (found) setCaseData(found)
    else router.push('/case-study')
  }, [caseId, router])

  if (!caseData) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-teal-400">Loading...</div>
  )

  const q = caseData.questions[currentQ]

  const handleAnswer = (opt: string) => {
    const newAns = [...answers]
    newAns[currentQ] = opt
    setAnswers(newAns)
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (currentQ < caseData.questions.length - 1) {
      setCurrentQ(i => i + 1)
      setShowExplanation(false)
    } else {
      // ✅ CALCULATE AND SAVE SCORE
      let correct = 0
      answers.forEach((ans, i) => {
        if (ans === caseData.questions[i].correct_answer) correct++
      })

      // ✅ GENERATE UNIQUE KEY FOR LOCALSTORAGE
      const uniqueId = `case_study_${caseId}`
      
      // ✅ CALCULATE PRC RATING
      const prcResult = calculatePRCRating(correct, caseData.questions.length)

      // ✅ SAVE TO LOCAL STORAGE
      try {
        saveModuleScore({
          moduleId: uniqueId,
          score: correct,
          totalQuestions: caseData.questions.length,
          rating: prcResult.rating,
          timestamp: Date.now()
        })
        console.log('💾 Case Study Score Saved:', uniqueId, '| Score:', correct + '/' + caseData.questions.length)
      } catch (err) {
        console.error('Failed to save case study score:', err)
      }

      setScore(correct)
    }
  }

  if (score !== null) {
    const prcResult = calculatePRCRating(score, caseData.questions.length)
    
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex flex-col items-center justify-center text-white">
        <h2 className="text-3xl font-bold mb-4">Quiz Complete</h2>
        
        {/* ✅ PRC RATING BADGE */}
        <div className={`inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-full border ${prcResult.color}`}>
          <span className="font-mono font-bold text-2xl">#{prcResult.rating}</span>
          <span className="font-semibold text-xl">{prcResult.label}</span>
        </div>
        
        <p className="mt-4 text-lg text-gray-300">
          Raw Score: {score}/{caseData.questions.length} ({prcResult.percentage}%)
        </p>
        
        <button 
          onClick={() => router.push('/case-study')}
          className="mt-6 px-6 py-3 bg-teal-600 rounded-lg hover:bg-teal-700"
        >
          Back to Cases
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6 max-w-4xl mx-auto pt-20">
      <button 
        onClick={() => router.push('/case-study')}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2 shadow-lg"
      >
        ← Back to Cases
      </button>

      <CollapsibleVignette 
        title={caseData.clientName} 
        content={caseData.vignette} 
        defaultOpen={true} 
      />

      {/* Question */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <p className="text-sm text-gray-400 mb-2">
          {caseData.questions[currentQ].domain} • Question {currentQ + 1} of {caseData.questions.length}
        </p>
        <h3 className="text-lg font-semibold text-white mb-4">{q.question}</h3>
        
        <div className="space-y-2 mb-6">
          {q.options.map((opt: string, idx: number) => {
            const letter = String.fromCharCode(65 + idx)
            const isSelected = answers[currentQ] === letter
            const isCorrect = showExplanation && letter === q.correct_answer
            
            let cls = "w-full p-4 rounded-lg border text-left"
            if (showExplanation) {
              if (isCorrect) cls += " border-green-500 bg-green-900/20"
              else if (isSelected) cls += " border-red-500 bg-red-900/20"
              else cls += " border-gray-700 opacity-50"
            } else if (isSelected) {
              cls += " border-teal-500 bg-teal-900/20"
            } else {
              cls += " border-gray-700 hover:border-gray-600"
            }

            return (
              <button
                key={letter}
                onClick={() => !showExplanation && handleAnswer(letter)}
                disabled={showExplanation}
                className={cls}
              >
                <span className="font-mono mr-3 text-gray-400">{letter}.</span>
                {opt.replace(/^\d+\.\s*/, '')}
              </button>
            )
          })}
        </div>

        {showExplanation && q.explanation && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-sm text-blue-300 italic">{q.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!showExplanation ? (
            <button
              onClick={() => setShowExplanation(true)}
              disabled={!answers[currentQ]}
              className="px-6 py-2 bg-teal-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              {currentQ < caseData.questions.length - 1 ? 'Next' : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}