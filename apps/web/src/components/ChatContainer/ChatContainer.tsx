import { useState, useEffect, useCallback } from 'react'
import ChatInput from './ChatInput'
import InteractiveLogo from './InteractiveLogo'
import ChatResponse from './ChatResponse/ChatResponse'
import ProgressiveLoading from './ProgressiveLoading'
import { useSession } from '../../hooks/useSession'

interface SearchResult {
  title: string
  snippet: string
  link: string
}

interface SingleRiddle {
  finalResponse: string
  responseType: string
  riddleTarget?: string
  riddleQuality?: number
  sourceResult?: SearchResult
}

const ChatContainer = () => {
  const [response, setResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [primarySource, setPrimarySource] = useState<SearchResult | null>(null)
  const [riddles, setRiddles] = useState<SingleRiddle[] | null>(null)

  const {
    isLoading,
    currentAction,
    actionHistory,
    isCancelling,
    finalResponse,
    error,
    startSession,
    cancelSession,
    resetSession,
  } = useSession()

  const typeResponse = (text: string) => {
    setResponse('')
    setIsTyping(true)

    let index = 0
    const timer = setInterval(() => {
      setResponse(text.slice(0, index + 1))
      index++

      if (index >= text.length) {
        clearInterval(timer)
        setIsTyping(false)
      }
    }, 15)
  }

  // Handle final response when session completes
  useEffect(() => {
    if (finalResponse) {
      console.log('🔧 Complete V3 API Response Object:', finalResponse)

      // Check if this is a cancellation response
      if (finalResponse.cancelled) {
        typeResponse('Request cancelled')
        return
      }

      // Process the final response data
      const riddleResponseData = finalResponse.riddleResponse
      if (riddleResponseData) {
        // Set primary source if available
        if (
          riddleResponseData.searchResults &&
          riddleResponseData.searchResults.length > 0
        ) {
          setPrimarySource(riddleResponseData.searchResults[0])
        }

        // Set riddles if available
        if (
          riddleResponseData.riddles &&
          riddleResponseData.riddles.length > 0
        ) {
          setRiddles(riddleResponseData.riddles)
        }

        // Type the response
        if (riddleResponseData.finalResponse) {
          typeResponse(riddleResponseData.finalResponse)
        } else {
          typeResponse('The riddle escaped me this time...')
        }
      }
    }
  }, [finalResponse])

  const handleSubmit = async (question: string) => {
    // Reset previous state
    setResponse('')
    setPrimarySource(null)
    setRiddles(null)
    setIsTyping(false)
    resetSession()

    try {
      await startSession(question, 'v3')
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
      <div className="flex flex-col min-h-screen bg-gray-800 text-white">
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
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
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <InteractiveLogo />
        <ChatInput onSubmit={handleSubmit} isLoading={isLoading || isTyping} />

        {/* Progressive Loading UI */}
        {isLoading && (
          <div className="mt-8">
            <ProgressiveLoading
              currentAction={currentAction}
              isLoading={isLoading}
              onCancel={handleCancel}
              actionHistory={actionHistory}
              isCancelling={isCancelling}
            />
          </div>
        )}

        {/* Final Response */}
        {(response || isTyping) && !isLoading && (
          <div className="mt-8">
            <ChatResponse
              response={response}
              isTyping={isTyping}
              primarySource={primarySource}
              riddles={riddles}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatContainer
