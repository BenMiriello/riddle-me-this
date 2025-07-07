interface DecipherInput {
  question: string
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    AI_MODEL?: string
  }
  inputWasRiddle: boolean
}

interface DecipherOutput {
  searchQuery: string
  riddleDecipherResponse: string | null
}

const decipherStage = async (input: DecipherInput): Promise<DecipherOutput> => {
  let searchQuery = input.question
  let riddleDecipherResponse = null

  if (input.inputWasRiddle) {
    const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
    const response = await input.env.AI.run(model, {
      messages: [
        {
          role: 'system',
          content: `Decipher this riddle and provide the answer. Respond with EXACTLY this JSON format:

{
  "answer": "the actual answer/topic the riddle is asking about",
  "confidence": 0-100,
  "keyTerms": ["key", "terms", "from", "original", "riddle"]
}

- answer: What you think the riddle is asking about
- confidence: How confident you are (0-100%) that your answer is correct
- keyTerms: 3-5 important words from the original riddle that could help with searching

If you're less than 50% confident, extract more key terms to help with search.
Respond with ONLY the JSON object, nothing else.`,
        },
        { role: 'user', content: input.question },
      ],
    })

    riddleDecipherResponse = response.response

    try {
      const decipherData = JSON.parse(response.response)
      if (decipherData.confidence >= 50) {
        searchQuery = decipherData.answer
      } else {
        searchQuery = `${decipherData.answer} ${decipherData.keyTerms.join(' ')}`
      }
    } catch (error) {
      console.log('Riddle decipher parsing error:', error)
      searchQuery = input.question
    }
  }

  return {
    searchQuery,
    riddleDecipherResponse,
  }
}

export default decipherStage
export type { DecipherInput, DecipherOutput }
