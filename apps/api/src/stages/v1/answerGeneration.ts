interface AnswerInput {
  question: string
  searchQuery?: string // From decipher stage (optional if input wasn't a riddle)
  searchResults?: Array<{ title: string; snippet: string; link: string }> // From search stage
  needsSearch: boolean // From detection stage
  searchPerformed?: boolean // From search stage
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    AI_MODEL?: string
  }
}

interface AnswerOutput {
  answerResponse: string
}

const answerStage = async (input: AnswerInput): Promise<AnswerOutput> => {
  let answerResponse: string

  // searchQuery should now be available from flattened decipher stage output
  const queryToUse = input.searchQuery || input.question

  if (
    input.needsSearch &&
    input.searchPerformed &&
    input.searchResults &&
    input.searchResults.length > 0
  ) {
    // Generate answer using primary source (first result)
    const primarySource = input.searchResults[0]
    const searchContext = `${primarySource.title}: ${primarySource.snippet}`

    const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
    const response = await input.env.AI.run(model, {
      messages: [
        {
          role: 'system',
          content:
            'Using this specific source, answer the question directly and concisely. Focus on the information from this source. Be brief.',
        },
        {
          role: 'user',
          content: `Question: ${queryToUse}\n\nSource: ${searchContext}\n\nAnswer:`,
        },
      ],
    })
    answerResponse = response.response
  } else if (input.needsSearch && !input.searchPerformed) {
    // Fallback to knowledge-based answer if search was needed but failed
    const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
    const response = await input.env.AI.run(model, {
      messages: [
        {
          role: 'system',
          content:
            'This question requires current information, but search is unavailable. Provide the best general answer you can.',
        },
        { role: 'user', content: queryToUse },
      ],
    })
    answerResponse = response.response
  } else {
    // Use knowledge-based answer
    const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
    const response = await input.env.AI.run(model, {
      messages: [
        {
          role: 'system',
          content:
            'Answer directly and concisely. Be brief. Give only essential information. No fluff or explanations unless necessary.',
        },
        { role: 'user', content: queryToUse },
      ],
    })
    answerResponse = response.response
  }

  return {
    answerResponse,
  }
}

export default answerStage
export type { AnswerInput, AnswerOutput }
