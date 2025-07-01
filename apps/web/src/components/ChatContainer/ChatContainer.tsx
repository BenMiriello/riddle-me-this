import { useState, useEffect } from 'react'
import ChatInput from './ChatInput/ChatInput'
import InteractiveLogo from './InteractiveLogo/InteractiveLogo'

const ChatContainer = () => {
  const [response, setResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loadingDots, setLoadingDots] = useState('.')

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
    }, 30) // Type speed - 30ms per character
  }

  // Loading dots animation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTyping && response === '') {
      interval = setInterval(() => {
        setLoadingDots((prev) => {
          if (prev === '.') return '..'
          if (prev === '..') return '...'
          return '.'
        })
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isTyping, response])

  const handleSubmit = async (question: string) => {
    setResponse('') // Clear previous response immediately
    setIsTyping(true)
    setLoadingDots('.')

    try {
      const response = await fetch(
        'https://riddle-30e2.benmiriello.workers.dev/riddle',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
        }
      )

      const data = await response.json()

      // Console log for debugging
      console.log('=== API RESPONSE ===')
      console.log('Full response:', data)
      console.log('Answer:', data.answer)
      console.log('Riddle:', data.riddle)
      console.log('Response:', data.response)
      console.log('Input was riddle:', data.inputWasRiddle)
      console.log('Needs search:', data.needsSearch)
      console.log('Search performed:', data.searchPerformed)
      console.log('Search query:', data.searchQuery)
      console.log('Search results:', data.searchResults)
      console.log('Search results length:', data.searchResults?.length)
      console.log('Evaluation:', data.evaluation)
      console.log('=== END RESPONSE ===')

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
      typeResponse('The riddle spirits are silent today...')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      {/* Q&A interface - centered on page */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <InteractiveLogo />
        <ChatInput onSubmit={handleSubmit} isLoading={isTyping} />

        {/* Response appears below input */}
        {(response || isTyping) && (
          <div className="mt-4 text-white text-sm">
            {response || loadingDots}
            {isTyping && response && <span className="animate-pulse">|</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatContainer
