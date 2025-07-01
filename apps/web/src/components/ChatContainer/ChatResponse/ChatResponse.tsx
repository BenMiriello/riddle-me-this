import { useState, useEffect } from 'react'
import SearchResponseCard from './SearchResponseCard'

interface SourceType {
  title: string
  snippet: string
  link: string
}

interface ChatResponseProps {
  response: string
  isTyping: boolean
  primarySource: SourceType | null
}

const ChatResponse = ({
  response,
  isTyping,
  primarySource,
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
