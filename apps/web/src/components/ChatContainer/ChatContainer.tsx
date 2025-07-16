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
  sourceResult?: SearchResult
}

interface ApiResponseData {
  finalResponse: string
  searchResults?: SearchResult[]
  riddles?: SingleRiddle[]
  riddleResponse?: ApiResponseData // V3 nested format
  cancelled?: boolean
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

  const getResponseData = (response: any): ApiResponseData | null => {
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
    resetSession()

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
        <InteractiveLogo isLoading={isLoading} />
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
