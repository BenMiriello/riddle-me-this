interface AnswerGenerationInput {
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  primarySource?: { title: string; snippet: string; link: string }
  plainTextAnswer?: string
}

interface AnswerGenerationOutput {
  plainTextAnswer: string
  source: 'search' | 'knowledge'
}

const answerGeneration = ({
  primarySource,
  plainTextAnswer,
}: AnswerGenerationInput): AnswerGenerationOutput => {
  // TODO: fill in LLM operation later for generating answer from search results

  if (plainTextAnswer) {
    return {
      plainTextAnswer,
      source: 'knowledge',
    }
  }

  if (primarySource) {
    const searchContext = `${primarySource.title}: ${primarySource.snippet}`
    const answer = `Search-based answer using: ${searchContext}`

    return {
      plainTextAnswer: answer,
      source: 'search',
    }
  }

  return {
    plainTextAnswer: 'Unable to generate answer',
    source: 'knowledge',
  }
}

export default answerGeneration
