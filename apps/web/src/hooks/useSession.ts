import { useState, useRef, useEffect } from 'react'
import { track } from '../utils/analytics'

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
    // V3-only fallback action words for progressive UI simulation
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
    workflow: 'v1' | 'v2' | 'v3' | 'v4' = 'v4'
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

    if (workflow === 'v3') {
      startProgression()
    }

    const startTime = Date.now()
    track('riddle_submitted', {
      question: question.slice(0, 500),
      question_length: question.length,
      workflow,
    })

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/riddle`
      console.log('🔍 Making API request to:', apiUrl)
      console.log('🔍 Request body:', { question, workflow })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, workflow }),
        signal: abortControllerRef.current.signal,
      })

      console.log('🔍 Response status:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const elapsed = Date.now() - startTime

      // Check if cancelled during request
      if (cancelledRef.current) {
        track('riddle_cancelled', { waited_ms: elapsed })
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCancelling: false,
          finalResponse: {
            cancelled: true,
            message: 'Riddle me not, I guess...',
          },
        }))
        return
      }

      // Extract response text and metadata for tracking
      const responseData = data.riddleResponse || data
      const responseText = responseData.finalResponse || ''
      const responseType = responseData.responseType || 'unknown'
      const badges = (responseData.badges || [])
        .map((b: { type: string }) => b.type)
        .join(',')
      const searchPerformed = responseData.searchPerformed ? 1 : 0

      track('riddle_response', {
        question: question.slice(0, 500),
        response: responseText.slice(0, 500),
        response_type: responseType,
        badges,
        search_performed: searchPerformed,
        response_time_ms: elapsed,
        riddle_count: data.riddles ? data.riddles.length : 0,
      })

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
      const elapsed = Date.now() - startTime

      if (error instanceof Error && error.name === 'AbortError') {
        track('riddle_cancelled', { waited_ms: elapsed })
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCancelling: false,
          finalResponse: {
            cancelled: true,
            message: 'Riddle me not, I guess...',
          },
        }))
      } else {
        const apiUrl = import.meta.env.VITE_API_URL
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error'
        const detailedError = `API Error: ${errorMsg}. URL: ${apiUrl}/riddle. Check network connection.`

        track('riddle_error', { error: errorMsg, waited_ms: elapsed })

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: detailedError,
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
