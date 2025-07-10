import { useState, useEffect } from 'react'
import SearchResponseCard from './SearchResponseCard'

interface SourceType {
  title: string
  snippet: string
  link: string
}

interface SingleRiddle {
  finalResponse: string
  responseType: string
  riddleTarget?: string
  riddleQuality?: number
  sourceResult?: SourceType
}

interface ChatResponseProps {
  response: string
  isTyping: boolean
  primarySource: SourceType | null
  riddles?: SingleRiddle[] | null
}

const ChatResponse = ({
  response,
  isTyping,
  primarySource,
  riddles,
}: ChatResponseProps) => {
  const [loadingDots, setLoadingDots] = useState('.')

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

  // If we have multiple riddles, display them as separate cards
  if (riddles && riddles.length > 1) {
    return (
      <div className="space-y-4">
        {riddles.map((riddle, index) => (
          <SearchResponseCard
            key={index}
            response={riddle.finalResponse}
            isTyping={index === 0 ? isTyping : false}
            loadingDots={index === 0 ? loadingDots : ''}
            primarySource={riddle.sourceResult || null}
          />
        ))}
      </div>
    )
  }

  if (primarySource) {
    return (
      <SearchResponseCard
        response={response}
        isTyping={isTyping}
        loadingDots={loadingDots}
        primarySource={primarySource}
      />
    )
  }

  return (
    <div className="text-white text-sm">
      {response || loadingDots}
      {isTyping && response && <span className="animate-pulse">|</span>}
    </div>
  )
}

export default ChatResponse
