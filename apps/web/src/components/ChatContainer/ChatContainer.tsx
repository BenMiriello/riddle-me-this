import { useState } from 'react'
import ChatInput from './ChatInput'
import InteractiveLogo from './InteractiveLogo'
import ChatResponse from './ChatResponse/ChatResponse'
// import DeveloperPanel from '../DeveloperPanel'
// import { useDeveloperTrigger } from '../../hooks/useDeveloperTrigger'
import { printResponse } from '../../utils'

interface SearchResult {
  title: string
  snippet: string
  link: string
}

interface Badge {
  type: string
  earned: boolean
  context?: string
}

interface SingleRiddle {
  finalResponse: string
  responseType: string
  riddleTarget?: string
  riddleQuality?: number
  sourceResult?: SearchResult
}

// TODO: Import from API when types are properly exported
// import type { V2RiddleResponse } from '@api/workflows/v2'
interface ApiResponse {
  answer: string
  riddle: string
  response: string
  inputWasRiddle: boolean
  needsSearch: boolean
  searchPerformed: boolean
  searchQuery: string | null
  searchResults: SearchResult[]
  primarySource: SearchResult | null
  badges: Badge[]
  evaluation: string
  riddles?: SingleRiddle[] | null
  debug?: {
    riddleTarget: string
    answerSource: string
    processedInput: string
    riddleQuality?: number
    actualSearchQuery: string
    answerStrategy: string
    answerStrategyReasoning: string
    multipleRiddlesCount: number
  }
}

const ChatContainer = () => {
  const [response, setResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [primarySource, setPrimarySource] = useState<{
    title: string
    snippet: string
    link: string
  } | null>(null)
  const [riddles, setRiddles] = useState<SingleRiddle[] | null>(null)
  // const { showDeveloperPanel, checkDeveloperTrigger, closeDeveloperPanel } = useDeveloperTrigger()

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

  const handleSubmit = async (question: string) => {
    // Check for developer trigger first
    // if (checkDeveloperTrigger(question)) {
    //   return // Developer panel will show, don't process as normal question
    // }

    setResponse('')
    setPrimarySource(null)
    setRiddles(null)
    setIsTyping(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/v2/riddle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
        }
      )

      const data = (await response.json()) as ApiResponse

      // Log the complete API response object
      console.log('🔧 Complete API Response Object:', data)

      printResponse(data)

      // Enhanced debug logging
      console.log('🔍 API Response Analysis:')
      console.log('📝 Original query:', data.searchQuery)

      if (data.debug) {
        console.log('🎯 Riddle target selected:', data.debug.riddleTarget)
        console.log('📊 Answer source:', data.debug.answerSource)
        if (data.debug.processedInput !== data.searchQuery) {
          console.log('⚙️ Processed input:', data.debug.processedInput)
        }
        console.log('⭐ Riddle quality score:', data.debug.riddleQuality)
        console.log('🎲 Answer strategy:', data.debug.answerStrategy)
        if (
          data.debug.answerStrategyReasoning &&
          !data.debug.answerStrategyReasoning.includes('will come from')
        ) {
          console.log(
            '💭 Strategy reasoning:',
            data.debug.answerStrategyReasoning
          )
        }
        if (data.debug.multipleRiddlesCount > 0) {
          console.log(
            '🎭 Multiple riddles generated:',
            data.debug.multipleRiddlesCount
          )
        }
      }

      if (data.searchPerformed && data.searchResults.length > 0) {
        console.log(
          '🔎 Search performed with',
          data.searchResults.length,
          'results'
        )
        if (
          data.debug?.actualSearchQuery &&
          data.debug.actualSearchQuery !== data.searchQuery
        ) {
          console.log(
            '🔍 Actual search query used:',
            data.debug.actualSearchQuery
          )
        }
        console.log('🥇 Primary source:', data.primarySource?.title || 'None')
        if (data.debug?.answerSource === 'search') {
          console.log(
            '📄 Search result distilled into answer:',
            data.answer.substring(0, 100) + '...'
          )
          console.log(
            '🎯 Then transformed into riddle target:',
            data.debug.riddleTarget
          )
        }
      }

      // Log badges for future visual implementation
      if (data.badges && data.badges.length > 0) {
        console.log('🏆 Badges earned:', data.badges.length)
        data.badges.forEach((badge) => {
          console.log(`  - ${badge.type} (${badge.context})`)
        })
      } else {
        console.log('🏆 No badges earned this time')
      }

      // Log multiple riddles if present
      if (data.riddles && data.riddles.length > 0) {
        console.log('🎭 Individual riddles:')
        data.riddles.forEach((riddle, index) => {
          console.log(
            `  ${index + 1}. "${riddle.finalResponse}" (target: ${riddle.riddleTarget})`
          )
          console.log(`     Source: ${riddle.sourceResult?.title}`)
        })
      }

      if (data.primarySource && data.searchPerformed) {
        setPrimarySource(data.primarySource)
      }

      // Store riddles for multiple card display
      if (data.riddles && data.riddles.length > 0) {
        setRiddles(data.riddles)
      }

      if (data.response) {
        typeResponse(data.response)
      } else if (data.riddle && data.riddle !== data.answer) {
        typeResponse(data.riddle)
      } else if (data.answer) {
        typeResponse(data.answer)
      } else {
        typeResponse('The riddle escaped me this time...')
      }
    } catch (error) {
      console.error('Error:', error)
      typeResponse('Riddle me not. An error occured getting your response...')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <InteractiveLogo />
        <ChatInput onSubmit={handleSubmit} isLoading={isTyping} />

        {(response || isTyping) && (
          <div className="mt-4">
            <ChatResponse
              response={response}
              isTyping={isTyping}
              primarySource={primarySource}
              riddles={riddles}
            />
          </div>
        )}
      </div>

      {/* {showDeveloperPanel && (
        <DeveloperPanel onClose={closeDeveloperPanel} />
      )} */}
    </div>
  )
}

export default ChatContainer
