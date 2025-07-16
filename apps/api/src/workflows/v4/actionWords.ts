// V4 Action Words - Dynamic action word generation for progressive UI
// Moved from V3 workflow to support files for better organization

// Action word lists for UI
const actionWords = {
  generic: [
    'analyzing',
    'processing',
    'computing',
    'evaluating',
    'calculating',
    'resolving',
    'executing',
    'interpreting',
    'synthesizing',
    'deliberating',
    'examining',
    'inspecting',
    'reviewing',
    'assessing',
    'scanning',
    'parsing',
    'validating',
    'optimizing',
  ],
  riddleThemed: [
    'deciphering',
    'unraveling',
    'puzzling',
    'contemplating',
    'riddling',
    'mystifying',
    'pondering',
    'solving',
    'unveiling',
    'scrutinizing',
    'investigating',
    'deducing',
    'sleuthing',
    'detecting',
    'uncovering',
    'probing',
    'discovering',
    'revealing',
  ],
}

export interface ActionWordPair {
  presentTense: string
  pastTense: string
}

/**
 * Generate contextual action words based on input type and stage
 * @param stage - Current workflow stage
 * @param context - Context object with input information
 * @returns ActionWordPair with present and past tense verbs
 */
export function generateActionWords(
  _stage: string,
  context: {
    isRiddle?: boolean
    needsSearch?: boolean
    inputType?: string
    question?: string
  }
): ActionWordPair {
  // Smart contextual selection based on input type and stage
  if (context.isRiddle) {
    return { presentTense: 'deciphering', pastTense: 'deciphered' }
  }
  
  if (context.needsSearch) {
    return { presentTense: 'investigating', pastTense: 'investigated' }
  }
  
  if (context.inputType === 'url') {
    return { presentTense: 'exploring', pastTense: 'explored' }
  }
  
  if (context.inputType === 'procedural') {
    return { presentTense: 'processing', pastTense: 'processed' }
  }
  
  // Default random selection from appropriate word list
  return getRandomActionWord(context.question || '')
}

/**
 * Get random action word based on input content
 * @param input - Input string to analyze for context
 * @returns ActionWordPair with contextual action words
 */
export function getRandomActionWord(input: string): ActionWordPair {
  const allWords = [...actionWords.generic, ...actionWords.riddleThemed]
  const randomWord = allWords[Math.floor(Math.random() * allWords.length)]

  // Create contextual phrase based on input
  let presentTense: string
  let pastTense: string
  
  if (input.toLowerCase().includes('riddle')) {
    presentTense = `${randomWord} riddle`
    pastTense = `${randomWord.replace(/ing$/, 'ed')} riddle`
  } else if (input.toLowerCase().includes('search')) {
    presentTense = `${randomWord} query`
    pastTense = `${randomWord.replace(/ing$/, 'ed')} query`
  } else {
    presentTense = `${randomWord} input`
    pastTense = `${randomWord.replace(/ing$/, 'ed')} input`
  }

  return { presentTense, pastTense }
}

/**
 * Get stage-specific action words for workflow progression
 * @param stage - Workflow stage name
 * @param isRiddle - Whether input is a riddle
 * @param needsSearch - Whether search is needed
 * @returns ActionWordPair for the stage
 */
export function getStageActionWords(
  stage: 'classification' | 'search' | 'generation' | 'assembly',
  isRiddle = false
): ActionWordPair {
  switch (stage) {
    case 'classification':
      return isRiddle
        ? { presentTense: 'deciphering', pastTense: 'deciphered' }
        : { presentTense: 'analyzing', pastTense: 'analyzed' }
    
    case 'search':
      return { presentTense: 'searching knowledge', pastTense: 'found results' }
    
    case 'generation':
      return isRiddle
        ? { presentTense: 'providing answer', pastTense: 'answered' }
        : { presentTense: 'crafting riddle', pastTense: 'created riddle' }
    
    case 'assembly':
      return { presentTense: 'finalizing response', pastTense: 'completed' }
    
    default:
      return { presentTense: 'processing', pastTense: 'processed' }
  }
}
