import { useState, useRef, useEffect } from 'react'

interface SessionState {
  isLoading: boolean
  currentAction: string
  actionHistory: ActionHistory[]
  finalResponse: Record<string, unknown> | null
  error: string | null
  isCancelling: boolean
}

interface ActionHistory {
  text: string
  id: string
}

// Fallback action words for progressive UI simulation
const FALLBACK_ACTIONS = [
  'analyzing riddle',
  'deciphering input',
  'processing question',
  'contemplating puzzle',
  'examining query',
  'unraveling mystery',
  'searching knowledge',
  'evaluating options',
  'crafting response',
  'finalizing answer',
  'polishing result',
]

export const useSession = () => {
  const [state, setState] = useState<SessionState>({
    isLoading: false,
    currentAction: '',
    actionHistory: [],
    finalResponse: null,
    error: null,
    isCancelling: false,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cancelledRef = useRef(false)

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clean up all timers when component unmounts
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current)
        safetyTimerRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const startProgression = () => {
    let wordIndex = 0
    let actionIndex = 0
    const MAX_PROGRESSION_STEPS = FALLBACK_ACTIONS.length
    const MAX_PROGRESSION_TIME = 30000 // 30 seconds safety limit

    // Clear any existing timers
    stopProgression()

    const nextAction = () => {
      if (cancelledRef.current || wordIndex >= MAX_PROGRESSION_STEPS) {
        stopProgression()
        return
      }

      // Use fallback actions for progression simulation
      const currentWord = FALLBACK_ACTIONS[wordIndex]

      setState((prev) => ({ ...prev, currentAction: currentWord }))

      // Add completed action to history after a delay
      setTimeout(() => {
        if (cancelledRef.current) return
        setState((prev) => ({
          ...prev,
          actionHistory: [
            ...prev.actionHistory,
            {
              text: currentWord.replace(/ing$/, 'ed'),
              id: `action-${Date.now()}-${actionIndex++}`,
            },
          ],
        }))
      }, 1500)

      wordIndex++
    }

    // Start immediately
    nextAction()

    // Continue every 2-3 seconds, but limit total duration
    progressTimerRef.current = setInterval(nextAction, 2500)

    // Safety timeout to force stop progression after max time
    safetyTimerRef.current = setTimeout(() => {
      console.log('🔧 Safety timeout reached - stopping progression')
      stopProgression()
    }, MAX_PROGRESSION_TIME)
  }

  const stopProgression = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current)
      safetyTimerRef.current = null
    }
  }

  const startSession = async (
    question: string,
    workflow: 'v1' | 'v2' | 'v3' = 'v3'
  ) => {
    // Reset state
    setState({
      isLoading: true,
      currentAction: '',
      actionHistory: [],
      finalResponse: null,
      error: null,
      isCancelling: false,
    })

    cancelledRef.current = false
    abortControllerRef.current = new AbortController()

    // Start progression simulation for v3
    if (workflow === 'v3') {
      startProgression()
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/riddle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, workflow }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check if cancelled during request
      if (cancelledRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCancelling: false,
          finalResponse: { cancelled: true, message: 'Request cancelled' },
        }))
        return
      }

      // Stop progression and show final result
      stopProgression()
      setState((prev) => ({
        ...prev,
        isLoading: false,
        finalResponse: data,
        currentAction: '',
      }))
    } catch (error: unknown) {
      stopProgression()

      if (error instanceof Error && error.name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCancelling: false,
          finalResponse: { cancelled: true, message: 'Request cancelled' },
        }))
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to process question',
        }))
      }
    }
  }

  const cancelSession = () => {
    cancelledRef.current = true
    setState((prev) => ({ ...prev, isCancelling: true }))

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const resetSession = () => {
    stopProgression()
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setState({
      isLoading: false,
      currentAction: '',
      actionHistory: [],
      finalResponse: null,
      error: null,
      isCancelling: false,
    })

    cancelledRef.current = false
  }

  return {
    ...state,
    startSession,
    cancelSession,
    resetSession,
  }
}
