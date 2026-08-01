'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner' // ✅ Import toast function

export default function IntroPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has seen this before
    const hasSeenIntro = localStorage.getItem('hasSeenLicTechIntro')
    
    if (!hasSeenIntro) {
      // Show popup after a short delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('hasSeenLicTechIntro', 'true')
    
    // ✅ TEST TOAST: Shows when user closes the popup
    toast.success("Welcome aboard! 🎓", {
      description: "Your journey to becoming a licensee starts now. Padayon!",
      duration: 4000,
    })
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-teal-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-teal-900/30 relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-gray-800"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center space-y-5">
          <div className="text-6xl mb-2 animate-bounce"></div>
          
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome to LicTech!
          </h2>
          
          <p className="text-gray-300 leading-relaxed text-sm">
            This app helps you prepare for your incoming board exam. 
            Study hard, earn coins, and unlock premium modules as you progress!
          </p>
          
          {/* Padayon Message */}
          <div className="pt-4 border-t border-gray-800 mt-4">
            <p className="text-teal-400 font-bold text-xl italic">
              "Padayon!" 🇵🇭
            </p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Keep going, future RPm!
            </p>
          </div>

          <button 
            onClick={handleClose}
            className="w-full mt-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-teal-900/20"
          >
            Let's Start Studying! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}