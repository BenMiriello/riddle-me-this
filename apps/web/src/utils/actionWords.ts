// Fallback action words for frontend progressive UI simulation
// These are used when the API doesn't provide dynamic action words

export const ACTION_WORDS = {
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

export const COMPLETION_VERBS = {
  inputProcessing: [
    'deciphered',
    'analyzed',
    'parsed',
    'interpreted',
    'understood',
    'classified',
  ],
  searchAnswer: [
    'searched',
    'discovered',
    'found',
    'retrieved',
    'located',
    'gathered',
  ],
  riddleResponse: [
    'crafted',
    'generated',
    'composed',
    'created',
    'formulated',
    'constructed',
  ],
}

// Helper function to get random action word
export function getRandomActionWord(input?: string): string {
  const allWords = [...ACTION_WORDS.generic, ...ACTION_WORDS.riddleThemed]
  const randomWord = allWords[Math.floor(Math.random() * allWords.length)]

  // Create contextual phrase based on input
  if (input?.toLowerCase().includes('riddle')) {
    return `${randomWord} riddle`
  } else if (input?.toLowerCase().includes('search')) {
    return `${randomWord} query`
  } else {
    return `${randomWord} input`
  }
}

// Helper function to get contextual completion phrase
export function getCompletionPhrase(stage: string): string {
  const verbs = COMPLETION_VERBS[stage as keyof typeof COMPLETION_VERBS] || [
    'completed',
  ]
  const verb = verbs[Math.floor(Math.random() * verbs.length)]

  switch (stage) {
    case 'inputProcessing':
      return `${verb} input`
    case 'searchAnswer':
      return `${verb} search`
    case 'riddleResponse':
      return `${verb} response`
    default:
      return `${verb} task`
  }
}
