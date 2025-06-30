import { useState } from 'react'

const InteractiveLogo = () => {
  const [expandedWord, setExpandedWord] = useState<'Riddle' | 'Me' | 'This'>(
    'Riddle'
  )

  const handleInteraction = (word: 'Riddle' | 'Me' | 'This') => {
    if (expandedWord !== word) {
      setExpandedWord(word)
    }
  }

  return (
    <div className="text-center mb-8">
      <div className="text-5xl font-light text-white select-none flex justify-center items-center gap-1">
        <span
          className="overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:text-green-400"
          style={{ width: expandedWord === 'Riddle' ? '2.8em' : '0.6em' }}
          onMouseEnter={() => handleInteraction('Riddle')}
          onClick={() => handleInteraction('Riddle')}
        >
          <span className="whitespace-nowrap">Riddle</span>
        </span>
        <span
          className="overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:text-green-400 px-1"
          style={{ width: expandedWord === 'Me' ? '1.4em' : '0.93em' }}
          onMouseEnter={() => handleInteraction('Me')}
          onClick={() => handleInteraction('Me')}
        >
          <span className="whitespace-nowrap">Me</span>
        </span>
        <span
          className="overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:text-green-400"
          style={{ width: expandedWord === 'This' ? '2.4em' : '0.6em' }}
          onMouseEnter={() => handleInteraction('This')}
          onClick={() => handleInteraction('This')}
        >
          <span className="whitespace-nowrap">This</span>
        </span>
      </div>
    </div>
  )
}

export default InteractiveLogo
