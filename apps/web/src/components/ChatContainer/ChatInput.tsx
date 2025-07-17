import { useState, useRef } from 'react'

// Load Macondo Swash Caps font (consistent with other components)
const fontLink = document.createElement('link')
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Macondo+Swash+Caps&display=swap'
fontLink.rel = 'stylesheet'
if (!document.head.querySelector('link[href*="Macondo+Swash+Caps"]')) {
  document.head.appendChild(fontLink)
}

const macondoFont: React.CSSProperties = {
  fontFamily: 'Macondo Swash Caps, cursive',
  fontSize: '1.125rem', // Slightly bigger for input
}

const macondoButtonFont: React.CSSProperties = {
  fontFamily: 'Macondo Swash Caps, cursive',
  fontSize: '1.25rem', // Bigger for button
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  textRendering: 'optimizeLegibility',
}

interface ChatInputProps {
  onSubmit: (question: string) => void
  isLoading: boolean
}

const ChatInput = ({ onSubmit, isLoading }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const forceBlur = () => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute(
          'content',
          'width=device-width,initial-scale=1,maximum-scale=1'
        )
        setTimeout(() => {
          viewport.setAttribute(
            'content',
            'width=device-width,initial-scale=1,maximum-scale=10'
          )
          window.scrollTo(0, 0)
        }, 100)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim())
      forceBlur()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isLoading) {
        onSubmit(inputValue.trim())
        forceBlur()
      }
    }
  }

  const adjustHeight = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto'
    const computedStyle = getComputedStyle(target)
    const lineHeight = parseFloat(computedStyle.lineHeight)
    const paddingTop = parseFloat(computedStyle.paddingTop)
    const paddingBottom = parseFloat(computedStyle.paddingBottom)
    const maxLines = 4
    const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom

    const newHeight = Math.min(target.scrollHeight, maxHeight)
    target.style.height = newHeight + 'px'
    target.style.overflowY = target.scrollHeight > maxHeight ? 'auto' : 'hidden'

    // Auto-scroll when typing at end and content overflows
    if (
      target.selectionStart === target.value.length &&
      target.scrollHeight > maxHeight
    ) {
      target.scrollTop = target.scrollHeight
    }
  }

  return (
    <div className="bg-gray-700 rounded-lg border border-gray-600 p-3 w-full">
      <form
        onSubmit={handleSubmit}
        className="flex space-x-2 w-full items-center"
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={forceBlur}
          placeholder="Riddle this for me..."
          rows={1}
          className="flex-1 bg-gray-600 text-white border border-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
          disabled={isLoading}
          style={{
            height: 'auto',
            minHeight: '2.5rem',
            overflowY: 'hidden',
            ...macondoFont,
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            adjustHeight(target)
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 rounded-lg transition-colors h-10"
          style={macondoButtonFont}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatInput
