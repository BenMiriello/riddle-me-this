import { useState, useEffect, useCallback, useRef } from 'react'
import ChatInput from './ChatInput'
import InteractiveLogo from './InteractiveLogo'
import ChatResponse from './ChatResponse/ChatResponse'
import ProgressiveLoading from './ProgressiveLoading'
import { useSession } from '../../hooks/useSession'
import { useBadges } from '../../contexts/BadgeContext'
import {
  isRiddleResponse,
  createRiddleTypingAnimation,
} from '../../utils/riddleTextProcessing'

interface SearchResult {
  title: string
  snippet: string
  link: string
}

interface SingleRiddle {
  finalResponse: string
  responseType: string
  riddleTarget?: string
  sourceResult?: SearchResult
}

interface ApiResponseData {
  finalResponse: string
  searchResults?: SearchResult[]
  riddles?: SingleRiddle[]
  riddleResponse?: ApiResponseData // V3 nested format
  cancelled?: boolean
}

interface ChatContainerProps {
  onTextFillingChange?: (isTyping: boolean) => void
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  onTextFillingChange,
}) => {
  const [response, setResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [primarySource, setPrimarySource] = useState<SearchResult | null>(null)
  const [riddles, setRiddles] = useState<SingleRiddle[] | null>(null)
  const [responseHeight, setResponseHeight] = useState<number | null>(null)
  const [fullResponseText, setFullResponseText] = useState('')
  const measurementRef = useRef<HTMLDivElement>(null)

  const { clearNewlyAwardedBadge } = useBadges()

  const {
    isLoading,
    currentAction,
    actionHistory,
    isCancelling,
    finalResponse,
    error,
    winningText,
    badgeTier,
    startSession,
    cancelSession,
    resetSession,
  } = useSession()

  const typeResponse = (text: string) => {
    // First, measure the height needed for the full text
    setFullResponseText(text)
    setResponse('')

    // Give React a moment to render the measurement component
    setTimeout(() => {
      if (measurementRef.current) {
        const height = measurementRef.current.getBoundingClientRect().height
        setResponseHeight(height)

        // Start typing after height is set and transition begins
        setTimeout(() => {
          setIsTyping(true)
          onTextFillingChange?.(true)

          // Check if this is a riddle response
          if (isRiddleResponse(text)) {
            // Use riddle typing animation with line breaks and pauses
            createRiddleTypingAnimation(
              text,
              (currentText) => {
                setResponse(currentText)
              },
              () => {
                setIsTyping(false)
                onTextFillingChange?.(false)
              }
            )
          } else {
            // Use regular typing animation
            let index = 0
            const timer = setInterval(() => {
              setResponse(text.slice(0, index + 1))
              index++

              if (index >= text.length) {
                clearInterval(timer)
                setIsTyping(false)
                onTextFillingChange?.(false)
              }
            }, 15)
          }
        }, 500) // Wait for height transition
      }
    }, 50)
  }

  const getResponseData = (response: ApiResponse): ApiResponseData | null => {
    if (response.cancelled) return null

    // V3 format (nested) or V4 format (direct)
    return response.riddleResponse || response
  }

  // Handle final response when session completes
  useEffect(() => {
    if (!finalResponse) return

    console.log('Complete API Response Object:', finalResponse)

    if (finalResponse.cancelled) {
      typeResponse('Riddle me not, I guess...')
      return
    }

    const data = getResponseData(finalResponse)
    if (!data) return

    // Clean, typed data processing
    if (data.searchResults && data.searchResults.length > 0) {
      setPrimarySource(data.searchResults[0])
    }

    if (data.riddles && data.riddles.length > 0) {
      setRiddles(data.riddles)
    }

    typeResponse(data.finalResponse || 'The riddle escaped me this time...')
  }, [finalResponse])

  const handleSubmit = async (question: string) => {
    // Reset previous state
    setResponse('')
    setPrimarySource(null)
    setRiddles(null)
    setIsTyping(false)
    setResponseHeight(null)
    setFullResponseText('')
    onTextFillingChange?.(false)
    resetSession()

    // Clear badge glow when new question is asked
    clearNewlyAwardedBadge()

    try {
      await startSession(question, 'v4')
    } catch (error) {
      console.error('Error:', error)
      typeResponse('Riddle me not. An error occurred getting your response...')
    }
  }

  const handleCancel = useCallback(() => {
    console.log('🛑 handleCancel called')
    if (cancelSession) {
      cancelSession()
    }
  }, [cancelSession])

  // Show error if any
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-800 text-white justify-center items-center">
        <div className="w-full max-w-md px-4">
          <InteractiveLogo />
          <div className="text-red-400 text-center mt-4">{error}</div>
          <button
            onClick={resetSession}
            className="mt-2 px-4 py-2 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white justify-center items-center">
      <div className="w-full max-w-md px-4 transition-all duration-1000 ease-in-out">
        <InteractiveLogo isLoading={isLoading} />
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading || isTyping} />

        {/* Response Area with CSS Grid Transition */}
        <div
          className="mt-8 grid transition-all duration-10000 ease-in-out"
          style={{
            gridTemplateRows: isLoading || response || isTyping ? '1fr' : '0fr',
          }}
        >
          <div className="overflow-visible relative">
            {/* Progressive Loading UI */}
            <div
              className="transition-opacity duration-300 ease-in-out"
              style={{
                opacity: isLoading && !(response || isTyping) ? 1 : 0,
                pointerEvents:
                  isLoading && !(response || isTyping) ? 'auto' : 'none',
              }}
            >
              <ProgressiveLoading
                currentAction={currentAction}
                isLoading={isLoading}
                onCancel={handleCancel}
                actionHistory={actionHistory}
                isCancelling={isCancelling}
              />
            </div>

            {/* Measurement div for height calculation */}
            {fullResponseText && (
              <div
                ref={measurementRef}
                className="absolute top-0 left-0 -z-10 opacity-0 pointer-events-none"
                style={{ width: '100%', maxWidth: '448px' }}
              >
                <ChatResponse
                  response={fullResponseText}
                  isTyping={false}
                  primarySource={primarySource}
                  riddles={riddles}
                  winningText={winningText}
                  badgeTier={badgeTier}
                  fullTextLength={fullResponseText.length}
                />
              </div>
            )}

            {/* Final Response */}
            <div
              className="transition-opacity duration-300 ease-in-out"
              style={{
                opacity: response || isTyping ? 1 : 0,
                pointerEvents: response || isTyping ? 'auto' : 'none',
                height: responseHeight ? `${responseHeight}px` : 'auto',
              }}
            >
              <ChatResponse
                response={response}
                isTyping={isTyping}
                primarySource={primarySource}
                riddles={riddles}
                winningText={winningText}
                badgeTier={badgeTier}
                fullTextLength={fullResponseText.length}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatContainer
