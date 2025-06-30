import { useState } from 'react'
import ChatInput from './ChatInput/ChatInput'
import InteractiveLogo from './InteractiveLogo/InteractiveLogo'

const ChatContainer = () => {
  const [response, setResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)

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

  const handleSubmit = () => {
    // Start typing response after brief delay
    setTimeout(() => {
      typeResponse("I don't know about that")
    }, 500)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      {/* Q&A interface - centered on page */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <InteractiveLogo />
        <ChatInput onSubmit={handleSubmit} isLoading={isTyping} />

        {/* Response appears below input */}
        {response && (
          <div className="mt-4 text-white text-sm">
            {response}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatContainer
