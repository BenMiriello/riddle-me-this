import { useState } from 'react'
import ChatInput from './ChatInput'
import InteractiveLogo from './InteractiveLogo'
import ChatResponse from './ChatResponse/ChatResponse'
import { printResponse } from '../../utils'

const ChatContainer = () => {
  const [response, setResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [primarySource, setPrimarySource] = useState<{
    title: string
    snippet: string
    link: string
  } | null>(null)

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
    setResponse('')
    setPrimarySource(null)
    setIsTyping(true)

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

      printResponse(data)

      if (data.primarySource && data.searchPerformed) {
        setPrimarySource(data.primarySource)
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
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatContainer
