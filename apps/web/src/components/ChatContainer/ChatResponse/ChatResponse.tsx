import React from 'react'
import SearchResponseCard from './SearchResponseCard'

// Load Macondo font
const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Macondo&display=swap'
fontLink.rel = 'stylesheet'
if (!document.head.querySelector('link[href*="Macondo"]')) {
  document.head.appendChild(fontLink)
}

const responseTextStyle = {
  fontFamily: 'Macondo, cursive',
}

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
  // If we have multiple riddles, display them as separate cards
  if (riddles && riddles.length > 1) {
    return (
      <div className="space-y-4">
        {riddles.map((riddle, index) => (
          <SearchResponseCard
            key={index}
            response={riddle.finalResponse}
            isTyping={index === 0 ? isTyping : false}
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
        primarySource={primarySource}
      />
    )
  }

  return (
    <div className="text-white text-lg" style={responseTextStyle}>
      {response}
      {isTyping && response && <span className="animate-pulse">|</span>}
    </div>
  )
}

export default ChatResponse
