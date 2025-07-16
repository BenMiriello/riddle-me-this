interface FinalOutput {
  answer: string
  riddle: string
  response: string
  inputWasRiddle: boolean
  needsSearch: boolean
  searchQuery: string | null
  originalQuestion: string
  searchResults: Array<{ title: string; snippet: string; link: string }>
  primarySource: { title: string; snippet: string; link: string } | null
  searchPerformed: boolean
  evaluation: string
  riddleDecipher: string | null
}

// Flattened input - all previous step results merged into a flat object
interface FlattenedMergeInput {
  // From initial input
  question: string

  // From detection stage
  needsSearch: boolean
  inputWasRiddle: boolean
  detectionResponse: string

  // From decipher stage (optional)
  searchQuery?: string
  riddleDecipherResponse?: string | null

  // From search stage (optional)
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  searchPerformed?: boolean

  // From answer stage
  answerResponse: string

  // From riddle stage (optional)
  riddleResponse?: string
}

const createFinalResponse = (input: FlattenedMergeInput): FinalOutput => {
  const finalResponse = input.inputWasRiddle
    ? input.answerResponse
    : input.riddleResponse || input.answerResponse

  return {
    answer: input.answerResponse,
    riddle: input.riddleResponse || input.answerResponse,
    response: finalResponse,
    inputWasRiddle: input.inputWasRiddle,
    needsSearch: input.needsSearch,
    searchQuery: input.needsSearch ? input.searchQuery || null : null,
    originalQuestion: input.question,
    searchResults: input.searchResults || [],
    primarySource: (input.searchResults && input.searchResults[0]) || null,
    searchPerformed: input.searchPerformed || false,
    evaluation: input.detectionResponse,
    riddleDecipher: input.riddleDecipherResponse || null,
  }
}

export default createFinalResponse
export type { FinalOutput, FlattenedMergeInput }
