import { useState, useRef, useEffect } from 'react'

const InteractiveLogo = () => {
  const [expandedWord, setExpandedWord] = useState<'Riddle' | 'Me' | 'This'>(
    'Riddle'
  )
  const [highlightedWord, setHighlightedWord] = useState<
    'Riddle' | 'Me' | 'This' | null
  >(null)
  const [mounted, setMounted] = useState(false)
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleInteraction = (word: 'Riddle' | 'Me' | 'This') => {
    if (expandedWord !== word) {
      setExpandedWord(word)
      setHighlightedWord(word)
      setTimeout(() => setHighlightedWord(null), 300)
    }
  }

  const words = [
    { key: 'Riddle' as const, text: 'Riddle' },
    { key: 'Me' as const, text: 'Me' },
    { key: 'This' as const, text: 'This' },
  ]

  const baseClasses = 'text-5xl font-light select-none'

  const getWidth = (word: string) => {
    if (!mounted || !measureRef.current) return 100
    const span = measureRef.current.querySelector(
      `[data-word="${word}"]`
    ) as HTMLElement
    if (!span) return 100
    return span.offsetWidth + 12
  }

  return (
    <div className="text-center mb-8">
      <div className="relative">
        {/* Hidden measurement layer */}
        <div
          ref={measureRef}
          className={`${baseClasses} absolute opacity-0 pointer-events-none`}
        >
          {words.map((word) => (
            <span key={word.key} data-word={word.key} className="mr-2">
              {word.text}
            </span>
          ))}
        </div>

        {/* Visible layer - display only */}
        <div className={`${baseClasses} text-white`}>
          {words.map((word) => (
            <span
              key={`visible-${word.key}`}
              className="inline-block overflow-hidden mr-2"
              style={{
                width:
                  expandedWord === word.key
                    ? `${getWidth(word.key)}px`
                    : '1.5rem',
                color: highlightedWord === word.key ? '#10b981' : 'white',
                transition:
                  'width 0.3s ease-in-out' +
                  (highlightedWord !== word.key ? ', color 0.3s ease-out' : ''),
              }}
            >
              <span className="whitespace-nowrap transition-opacity duration-200">
                {expandedWord === word.key ? word.text : '?'}
              </span>
            </span>
          ))}
        </div>

        {/* Invisible overlay - event handling */}
        <div className={`${baseClasses} absolute inset-0 opacity-0 right-2`}>
          {words.map((word) => (
            <span
              key={`overlay-${word.key}`}
              className="cursor-pointer mr-2"
              onMouseEnter={() => handleInteraction(word.key)}
              onClick={() => handleInteraction(word.key)}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InteractiveLogo
