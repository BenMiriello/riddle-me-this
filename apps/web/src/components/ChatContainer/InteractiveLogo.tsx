import { useState, useRef } from 'react'

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

const randomWords1 = ['Whittle', 'Whistle', 'Fiddle', 'Middle']
const advancedRandomWords1 = ['Thistle', 'Mistle', 'Bristol', 'Pistol']

const randomWords2 = ['You', 'Knee', 'Whee', 'We']

const randomWords3 = [
  'What',
  'Why',
  'What Now?',
  'Where',
  'How',
  'When',
  'Who',
  'That',
  'Thee',
  'Thou',
  'Thus',
]
const advancedRandomWords3 = ['Softly', 'Timbers', 'Christmas']

const InteractiveLogo = ({ isLoading = false }: { isLoading?: boolean }) => {
  const [hoveredIndex, setHoveredIndex] = useState<0 | 1 | 2 | null>(null)
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null)
  const randomWordRefs = useRef<[string, string, string]>([
    'Riddle',
    'Me',
    'This',
  ])

  const getWordOptions = (index: number) => {
    if (index === 0) {
      return isLoading
        ? [...randomWords1, ...advancedRandomWords1]
        : randomWords1
    } else if (index === 1) {
      return randomWords2
    } else if (index === 2) {
      return isLoading
        ? [...randomWords3, ...advancedRandomWords3]
        : randomWords3
    }
    return []
  }

  const getDefaultWord = (index: number) => {
    if (index === 0) return 'Riddle'
    if (index === 1) return 'Me'
    if (index === 2) return 'This'
    return ''
  }

  const getRandomChance = (index: number) => {
    if (isLoading) {
      if (index === 0) return 0.5
      if (index === 1) return 0.333
      if (index === 2) return 1.0
    } else {
      if (index === 0) return 0.1
      if (index === 1) return 0.0
      if (index === 2) return 0.25
    }
    return 0
  }

  const handleInteraction = (word: string, index: number) => {
    const randomValue = Math.random()
    const chance = getRandomChance(index)

    if (randomValue < chance) {
      // Show random word
      const options = getWordOptions(index)
      const randomIndex = Math.floor(Math.random() * options.length)
      randomWordRefs.current[index] = options[randomIndex]
    } else {
      // Show default word
      randomWordRefs.current[index] = getDefaultWord(index)
    }

    setHoveredIndex(index as 0 | 1 | 2)
    setHighlightedWord(word)
    setTimeout(() => setHighlightedWord(null), 300)
  }

  const words = ['Riddle', 'Me', 'This'] as const

  const baseClasses = 'text-5xl select-none'
  const fontFamily = currentFont.family
  const fontStyle: React.CSSProperties = {
    fontFamily: fontFamily,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'optimizeLegibility',
  }

  const getExpandedWidth = (index: number) => {
    // Get the current word for this index from refs
    const currentWord = randomWordRefs.current[index]

    // Create canvas to measure text width
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('ctx not found in interactive logo :(')
      return 90 // fallback width
    }

    // Use smaller font size for measurement, then scale up
    ctx.font = `300 32px ${currentFont.family}`
    const measuredWidth = ctx.measureText(currentWord).width

    // Scale from 32px measurement to text-5xl size (approximately 48px)
    const scaledWidth = measuredWidth * (48 / 32)

    // Add padding and return rounded width
    return Math.ceil(scaledWidth + 10)
  }

  const pickWord = (index: number) => {
    // Use the ref value for all words (immediately available)
    return randomWordRefs.current[index]
  }

  return (
    <div className="text-center mb-8">
      <div className="relative">
        {/* Visible layer - display only */}
        <div className={`${baseClasses} text-white`} style={fontStyle}>
          {words.map((word, index) => (
            <span
              key={`visible-${word}`}
              className="inline-block overflow-hidden mr-2"
              style={{
                width:
                  hoveredIndex === index
                    ? `${getExpandedWidth(index)}px`
                    : '1.5rem',
                color: highlightedWord === word ? '#10b981' : 'white',
                transition: 'width 0.4s ease-in-out, color 0.4s ease-out',
                ...fontStyle,
              }}
            >
              <span className="whitespace-nowrap transition-opacity duration-200">
                {hoveredIndex === index ? pickWord(index) : '?'}
              </span>
            </span>
          ))}
        </div>

        {/* Invisible overlay - event handling */}
        <div
          className={`${baseClasses} absolute inset-0 opacity-0 right-2`}
          style={fontStyle}
        >
          {words.map((word, index) => (
            <span
              key={`overlay-${word}`}
              className="cursor-pointer mr-2 py-2 px-4"
              onMouseEnter={() => handleInteraction(word, index)}
              onMouseLeave={() => setHoveredIndex(null)}
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
