'use client'

interface StreakProgressBarProps {
  currentStreak: number
  weeklyTotal: number
  daysRemaining: number
}

export default function StreakProgressBar({ 
  currentStreak, 
  weeklyTotal, 
  daysRemaining 
}: StreakProgressBarProps) {
  const progressPercent = Math.min((currentStreak / 7) * 100, 100)
  const isMaxed = currentStreak >= 7

  return (
    <div className="bg-gray-900 border border-teal-800 rounded-xl p-4 mb-6">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
          🔥 Weekly Login Streak
        </h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          isMaxed 
            ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' 
            : 'bg-teal-900/50 text-teal-300 border border-teal-700'
        }`}>
          {isMaxed ? 'WEEKLY CAP REACHED' : `Day ${currentStreak}/7`}
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden mb-2 relative">
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            isMaxed ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-teal-600 to-teal-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>Earned: <span className="text-white font-bold">{weeklyTotal}/45</span> coins this week</span>
        <span>{daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left` : 'Reset next Monday'}</span>
      </div>
    </div>
  )
}