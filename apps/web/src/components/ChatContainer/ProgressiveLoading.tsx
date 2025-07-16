import { useState, useEffect } from 'react'

interface ActionHistory {
  text: string
  id: string
}

interface ProgressiveLoadingProps {
  currentAction: string
  isLoading: boolean
  onCancel?: () => void
  actionHistory?: ActionHistory[]
  isCancelling?: boolean
}

const ProgressiveLoading = ({
  currentAction,
  isLoading,
  onCancel,
  actionHistory = [],
  isCancelling = false,
}: ProgressiveLoadingProps) => {
  const [loadingDots, setLoadingDots] = useState('.')
  const [isWritingWord, setIsWritingWord] = useState(false)
  const [displayedAction, setDisplayedAction] = useState('')
  const [displayedHistory, setDisplayedHistory] = useState<ActionHistory[]>([])

  // Animated dots for loading state
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading && !isWritingWord) {
      interval = setInterval(() => {
        setLoadingDots((prev) => {
          if (prev === '') return '.'
          if (prev === '.') return '..'
          if (prev === '..') return '...'
          return ''
        })
      }, 500)
    } else if (!isLoading) {
      setLoadingDots('.') // Reset dots when not loading
    }
    return () => clearInterval(interval)
  }, [isLoading, isWritingWord])

  // Handle current action word animation
  useEffect(() => {
    // Only start animation if we have a new action that's different from what's displayed
    if (currentAction && currentAction !== displayedAction) {
      setIsWritingWord(true)
      setDisplayedAction('')

      let index = 0
      const timer = setInterval(() => {
        setDisplayedAction(currentAction.slice(0, index + 1))
        index++

        if (index >= currentAction.length) {
          clearInterval(timer)
          setIsWritingWord(false)
        }
      }, 50) // Fast typing animation

      return () => clearInterval(timer)
    }
  }, [currentAction])

  // Slide-down animation for action history
  useEffect(() => {
    if (actionHistory.length > displayedHistory.length) {
      const newAction = actionHistory[actionHistory.length - 1]

      // Move current action to history with animation
      setTimeout(() => {
        setDisplayedHistory((prev) => [newAction, ...prev])
      }, 500)
    }
  }, [actionHistory, displayedHistory])

  if (!isLoading) return null

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Action text and history */}
      <div className="flex-1">
        {/* Current action */}
        <div className="text-white text-sm flex items-center">
          {isCancelling ? (
            <>
              <span>Attempting to cancel</span>
              <span className="ml-1 opacity-70">{loadingDots}</span>
            </>
          ) : (
            <>
              <span className="min-w-0">
                {displayedAction || currentAction}
              </span>
              {!isWritingWord && (
                <span className="ml-1 opacity-70">{loadingDots}</span>
              )}
            </>
          )}
        </div>

        {/* Action history */}
        <div className="mt-1 space-y-1">
          {displayedHistory.map((action, index) => (
            <div
              key={action.id}
              className={`text-gray-400 text-xs transition-all duration-500 ${
                index === 0 ? 'animate-slide-down' : ''
              }`}
            >
              {action.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Stop button */}
      {isLoading && onCancel && !isCancelling && (
        <button
          onClick={onCancel}
          className="ml-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors group"
          title="Stop"
        >
          <div className="w-3 h-3 bg-white rounded-sm group-hover:bg-gray-200 transition-colors"></div>
        </button>
      )}
    </div>
  )
}

export default ProgressiveLoading
