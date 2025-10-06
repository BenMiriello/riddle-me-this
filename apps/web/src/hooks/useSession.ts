import { useState, useRef, useEffect } from 'react'
import { detectRiddleBadge } from '../utils/badgeDetection'
import { useBadges } from '../contexts/BadgeContext'

interface SessionState {
  isLoading: boolean
  currentAction: string
  actionHistory: ActionHistory[]
  finalResponse: Record<string, unknown> | null
  error: string | null
  isCancelling: boolean
  winningText: string | null
  badgeTier: 'gold' | 'silver' | null
}

interface ActionHistory {
  text: string
  id: string
}

export const useSession = () => {
  const { awardBadge } = useBadges()
  const [state, setState] = useState<SessionState>({
    isLoading: false,
    currentAction: '',
    actionHistory: [],
    finalResponse: null,
    error: null,
    isCancelling: false,
    winningText: null,
    badgeTier: null,
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
    const badgeDetection = detectRiddleBadge(question)
    const winningText: string | null = null

    if (badgeDetection) {
      const contextualActions = {
        gold: [
          'Oh I know this one',
          'Ah, a classic riddle!',
          "This one's familiar",
        ],
        silver: [
          'You might be onto something there',
          'Where have I heard that before?',
          'That rings a bell',
        ],
      }

      const actionText =
        contextualActions[badgeDetection.tier][
          Math.floor(
            Math.random() * contextualActions[badgeDetection.tier].length
          )
        ]

      setState({
        isLoading: true,
        currentAction: actionText,
        actionHistory: [],
        finalResponse: null,
        error: null,
        isCancelling: false,
        winningText: question,
        badgeTier: badgeDetection.tier,
      })

      // Award badge and show response after 2s delay
      setTimeout(() => {
        awardBadge({
          id: badgeDetection.badge.id,
          name: badgeDetection.badge.name,
          description: badgeDetection.badge.description,
          tier: badgeDetection.tier,
          triggerText: question,
        })

        // Return appropriate response based on input type
        let responseText = ''

        if (badgeDetection.tier === 'gold') {
          // Riddle input → return answer
          if (badgeDetection.badge.answer) {
            responseText = badgeDetection.badge.answer
          } else {
            // Special riddles with no answer (Alice in Wonderland, etc.)
            responseText =
              badgeDetection.badge.hardcodedResponse ||
              'Some questions have no answers, only wonder.'
          }
        } else {
          // Answer input → return riddle
          responseText = badgeDetection.badge.riddleText
        }

        setState({
          isLoading: false,
          currentAction: '',
          actionHistory: [],
          finalResponse: {
            finalResponse: responseText,
            badgeAwarded: true,
            badgeTier: badgeDetection.tier,
          },
          error: null,
          isCancelling: false,
          winningText: question,
          badgeTier: badgeDetection.tier,
        })
      }, 3000)

      return
    }

    // Stop any existing progression timers first
    stopProgression()

    // Reset state for API call
    setState({
      isLoading: true,
      currentAction: '',
      actionHistory: [],
      finalResponse: null,
      error: null,
      isCancelling: false,
      winningText,
      badgeTier: null,
    })

    cancelledRef.current = false
    abortControllerRef.current = new AbortController()

    if (['v3', 'v4'].includes(workflow)) {
      startProgression()
    }

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

      // Check if cancelled during request
      if (cancelledRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCancelling: false,
          finalResponse: {
            cancelled: true,
            message: 'Riddle me not, I guess...',
          },
          badgeTier: null,
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
        badgeTier: null,
      }))
    } catch (error: unknown) {
      stopProgression()

      if (error instanceof Error && error.name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isCancelling: false,
          finalResponse: {
            cancelled: true,
            message: 'Riddle me not, I guess...',
          },
          badgeTier: null,
        }))
      } else {
        // More detailed error for mobile debugging
        const apiUrl = import.meta.env.VITE_API_URL
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error'
        const detailedError = `API Error: ${errorMsg}. URL: ${apiUrl}/riddle. Check network connection.`

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: detailedError,
          badgeTier: null,
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
      winningText: null,
      badgeTier: null,
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
