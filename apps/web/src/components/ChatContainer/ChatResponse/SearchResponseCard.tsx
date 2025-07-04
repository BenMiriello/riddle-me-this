import { useState } from 'react'

interface SourceType {
  title: string
  snippet: string
  link: string
}

interface SearchResponseCardProps {
  response: string
  isTyping: boolean
  loadingDots: string
  primarySource: SourceType
}

const SearchResponseCard = ({
  response,
  isTyping,
  loadingDots,
  primarySource,
}: SearchResponseCardProps) => {
  const [showSourceUrl, setShowSourceUrl] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')

  const typeSourceUrl = (url: string) => {
    setSourceUrl('')
    setShowSourceUrl(true)

    let index = 0
    const timer = setInterval(() => {
      const currentText = url.slice(0, index + 1)
      setSourceUrl(currentText + (index < url.length ? '|' : ''))
      index++

      if (index >= url.length) {
        setTimeout(() => setSourceUrl(url), 100)
        clearInterval(timer)
      }
    }, 15)
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile) {
      // Mobile: first tap shows URL, second tap allows navigation
      if (!showSourceUrl) {
        e.preventDefault() // Prevent navigation on first tap
        typeSourceUrl(primarySource.link)
      }
      // Second tap: let browser handle navigation naturally
    }
    // Desktop: let browser handle navigation naturally
  }

  const handleContextMenu = async (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.log('Copy failed:', err)
    }
  }

  return (
    <div className="bg-gray-700 rounded-lg border border-gray-600 p-3 relative">
      <div className="text-white text-sm mb-2">
        {response || loadingDots}
        {isTyping && response && <span className="animate-pulse">|</span>}
      </div>

      <a
        href={primarySource.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex justify-between items-center cursor-pointer group no-underline"
        onClick={handleClick}
        {...(!isMobile && {
          onMouseEnter: () => typeSourceUrl(primarySource.link),
          onMouseLeave: () => setShowSourceUrl(false),
        })}
        onContextMenu={(e) => handleContextMenu(e, primarySource.link)}
      >
        <div className="flex-1 mr-4 min-w-0">
          {showSourceUrl && (
            <div className="text-xs text-blue-300 active:text-blue-100 truncate">
              {sourceUrl}
            </div>
          )}
        </div>

        <button className="text-xs text-gray-400 group-hover:text-blue-300 active:text-blue-100 transition-colors flex items-center gap-1 ml-2">
          Source<span>&gt;</span>
        </button>
      </a>
    </div>
  )
}

export default SearchResponseCard
