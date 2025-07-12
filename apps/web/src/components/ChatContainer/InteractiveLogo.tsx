import { useState } from 'react'

const FONT_CONFIG = {
  current: 'macondo' as const,
  // current: 'aladin' as const,

  fonts: {
    aladin: {
      name: 'Aladin',
      family: 'Aladin, cursive',
      url: 'https://fonts.googleapis.com/css2?family=Aladin&display=swap',
    },
    macondo: {
      name: 'Macondo Swash Caps',
      family: 'Macondo Swash Caps, cursive',
      url: 'https://fonts.googleapis.com/css2?family=Macondo+Swash+Caps&display=swap',
    },
  },
} as const

const currentFont = FONT_CONFIG.fonts[FONT_CONFIG.current]
const fontLink = document.createElement('link')
fontLink.href = currentFont.url
fontLink.rel = 'stylesheet'
if (
  !document.head.querySelector(
    `link[href*="${currentFont.name.split(' ')[0]}"]`
  )
) {
  document.head.appendChild(fontLink)
}

const InteractiveLogo = () => {
  const [hoveredIndex, setHoveredIndex] = useState<0 | 1 | 2 | null>(null)
  const [highlightedWord, setHighlightedWord] = useState<
    'Riddle' | 'Me' | 'This' | null
  >(null)

  const handleInteraction = (word: 'Riddle' | 'Me' | 'This', index: number) => {
    setHoveredIndex(index as 0 | 1 | 2)
    setHighlightedWord(word)
    setTimeout(() => setHighlightedWord(null), 300)
  }

  const words = ['Riddle', 'Me', 'This'] as const

  const baseClasses = 'text-5xl select-none'
  const fontFamily = currentFont.family

  const getExpandedWidth = (index: number) => {
    // Approximate widths for text-5xl font-light
    if (index === 0) return 130 // "Riddle"
    if (index === 1) return 70 // "Me"
    if (index === 2) return 90 // "This"
  }

  const wordStyle = (word: typeof highlightedWord, index: number) => ({
    width: hoveredIndex === index ? `${getExpandedWidth(index)}px` : '1.5rem',
    color: highlightedWord === word ? '#10b981' : 'white',
    transition:
      'width 0.4s ease-in-out' +
      (highlightedWord !== word ? ', color 0.4s ease-out' : ''),
    fontFamily: fontFamily,
  })

  return (
    <div className="text-center mb-8">
      <div className="relative">
        {/* Visible layer - display only */}
        <div className={`${baseClasses} text-white`} style={{ fontFamily }}>
          {words.map((word, index) => (
            <span
              key={`visible-${word}`}
              className="inline-block overflow-hidden mr-2"
              style={wordStyle(word, index)}
            >
              <span className="whitespace-nowrap transition-opacity duration-200">
                {hoveredIndex === index ? word : '?'}
              </span>
            </span>
          ))}
        </div>

        {/* Invisible overlay - event handling */}
        <div
          className={`${baseClasses} absolute inset-0 opacity-0 right-2`}
          style={{ fontFamily }}
        >
          {words.map((word, index) => (
            <span
              key={`overlay-${word}`}
              className="cursor-pointer mr-2 py-2 px-4"
              onMouseEnter={() => setHoveredIndex(index as 0 | 1 | 2)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleInteraction(word, index)}
            >
              ?
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InteractiveLogo
