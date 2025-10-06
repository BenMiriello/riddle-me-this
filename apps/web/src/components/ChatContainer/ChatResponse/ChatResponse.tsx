import SearchResponseCard from './SearchResponseCard'

// Load Macondo Swash Caps font (same as InteractiveLogo)
const fontLink = document.createElement('link')
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Macondo+Swash+Caps&display=swap'
fontLink.rel = 'stylesheet'
if (!document.head.querySelector('link[href*="Macondo+Swash+Caps"]')) {
  document.head.appendChild(fontLink)
}

const responseTextStyle: React.CSSProperties = {
  fontFamily: 'Macondo Swash Caps, cursive',
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
  sourceResult?: SourceType
}

interface ChatResponseProps {
  response: string
  isTyping: boolean
  primarySource: SourceType | null
  riddles?: SingleRiddle[] | null
  winningText?: string | null
  badgeTier?: 'gold' | 'silver' | null
  fullTextLength?: number
}

const ChatResponse = ({
  response,
  isTyping,
  primarySource,
  riddles,
  winningText,
  badgeTier,
  fullTextLength,
}: ChatResponseProps) => {
  // Check if this response should glow - only for badge responses
  const shouldGlow = winningText && badgeTier
  const glowClass = shouldGlow
    ? badgeTier === 'gold'
      ? 'text-glow-gold'
      : 'text-glow-silver'
    : ''

  // Add indent for short responses - use full text length if available
  const textLength = fullTextLength || response.length
  const shouldIndent = textLength < 15
  const indentStyle = shouldIndent ? { paddingLeft: '1rem' } : {}
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
    <div
      className={`text-white text-lg ${glowClass}`}
      style={{ ...responseTextStyle, ...indentStyle, whiteSpace: 'pre-wrap' }}
    >
      {response}
      {isTyping && response && <span className="animate-pulse">|</span>}
    </div>
  )
}

export default ChatResponse
