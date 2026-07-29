'use client'
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg text-center">
          <h3 className="text-red-400 font-bold mb-2">Something went wrong</h3>
          <p className="text-gray-300 text-sm mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}