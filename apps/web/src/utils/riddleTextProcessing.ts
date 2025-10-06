// Utility functions for processing riddle text

export const isRiddleResponse = (text: string): boolean => {
  // Check for riddle patterns
  const riddlePatterns = [
    /\?/g, // Contains question marks
    /what\s+(?:is|are|has|have|can|could|would|will|does|do)/i, // "What is/are/has..." patterns
    /who\s+(?:is|are|has|have|can|could|would|will|does|do)/i, // "Who is/are/has..." patterns
    /when\s+(?:is|are|has|have|can|could|would|will|does|do)/i, // "When is/are/has..." patterns
    /where\s+(?:is|are|has|have|can|could|would|will|does|do)/i, // "Where is/are/has..." patterns
    /why\s+(?:is|are|has|have|can|could|would|will|does|do)/i, // "Why is/are/has..." patterns
    /how\s+(?:is|are|has|have|can|could|would|will|does|do)/i, // "How is/are/has..." patterns
    /riddle/i, // Contains the word "riddle"
    /puzzle/i, // Contains the word "puzzle"
    /mystery/i, // Contains the word "mystery"
  ]

  return riddlePatterns.some((pattern) => pattern.test(text))
}

export const createRiddleTypingAnimation = (
  text: string,
  onUpdate: (currentText: string) => void,
  onComplete: () => void
): void => {
  // Split on existing newlines only (no automatic line processing)
  const segments = text.split('\n')

  let currentSegmentIndex = 0
  let currentText = ''

  const typeSegment = (segmentText: string, callback: () => void) => {
    let charIndex = 0

    const typeChar = () => {
      if (charIndex < segmentText.length) {
        currentText += segmentText[charIndex]
        onUpdate(currentText)
        charIndex++
        setTimeout(typeChar, 25) // 25ms per character for riddles
      } else {
        callback()
      }
    }

    typeChar()
  }

  const processNextSegment = () => {
    if (currentSegmentIndex < segments.length) {
      const segment = segments[currentSegmentIndex]

      typeSegment(segment, () => {
        currentSegmentIndex++

        if (currentSegmentIndex < segments.length) {
          // Add line break and pause before next segment
          currentText += '\n'
          onUpdate(currentText)
          setTimeout(processNextSegment, 500)
        } else {
          onComplete()
        }
      })
    } else {
      onComplete()
    }
  }

  processNextSegment()
}
