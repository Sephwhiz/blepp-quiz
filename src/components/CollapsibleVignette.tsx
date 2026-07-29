'use client'

import { useState } from 'react'

interface Props {
  title: string
  content: string
  defaultOpen?: boolean
}

export default function CollapsibleVignette({ 
  title, 
  content, 
  defaultOpen = true 
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-6 border border-teal-700 rounded-xl bg-gray-900 overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition"
      >
        <h3 className="text-lg font-bold text-teal-400">{title}</h3>
        <span 
          className="text-teal-400 transform transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {/* Content Area */}
      {isOpen && (
        <div className="px-4 pb-4 prose prose-invert max-w-none text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  )
}