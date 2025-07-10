import { searchAnswerPrompts, knowledgeAnswerPrompts } from './prompts'

interface SearchAnswerInput {
  question: string
  isRiddle: boolean
  needsSearch: boolean
  processedInput: string
  riddleAnswer?: string
  searchableAnswer?: string
  userIntent: string
  inputType:
    | 'question'
    | 'url'
    | 'procedural'
    | 'numerical'
    | 'comparative'
    | 'descriptive'
    | 'transactional'
  coreContent: string
  answerStrategy: 'singular' | 'multiple'
  answerStrategyReasoning: string
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    GOOGLE_SEARCH_API_KEY?: string
    GOOGLE_SEARCH_ENGINE_ID?: string
    AI_MODEL?: string
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

interface SearchAnswerOutput {
  answerContent: string
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  searchPerformed: boolean
  answerSource: 'search' | 'knowledge' | 'riddle_answer'
  actualSearchQuery?: string
}

const searchAnswerStage = async (
  input: SearchAnswerInput
): Promise<SearchAnswerOutput> => {
  const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
  const promptMode = input.env.RIDDLE_PROMPT_MODE || 'concise'

  let answerContent = ''
  let searchResults: Array<{ title: string; snippet: string; link: string }> =
    []
  let searchPerformed = false
  let answerSource: 'search' | 'knowledge' | 'riddle_answer' = 'knowledge'

  // If we solved a riddle and don't need search, return the riddle answer
  if (input.isRiddle && input.riddleAnswer && !input.needsSearch) {
    return {
      answerContent: input.riddleAnswer,
      searchResults: [],
      searchPerformed: false,
      answerSource: 'riddle_answer',
    }
  }

  // Determine what to search for
  let searchQuery: string
  if (input.inputType === 'url') {
    searchQuery = input.question // Use original URL for search
  } else if (input.isRiddle && input.searchableAnswer) {
    searchQuery = input.searchableAnswer // Use context-preserved answer for search
  } else if (input.isRiddle && input.riddleAnswer) {
    searchQuery = input.riddleAnswer // Fallback to basic answer if no searchable answer
  } else {
    // Smart search query extraction for explicit search requests
    const searchPatterns = [
      /(?:search for|web search|look up|find information about|google)\s+(.+)/i,
      /(?:what is|who is|where is|when is|how is)\s+(.+)/i,
    ]

    let extractedQuery = input.question
    for (const pattern of searchPatterns) {
      const match = input.question.match(pattern)
      if (match && match[1]) {
        extractedQuery = match[1].trim()
        break
      }
    }

    searchQuery = extractedQuery // Use extracted query or original question
  }

  // Perform search if needed and API keys available

  if (
    input.needsSearch &&
    input.env.GOOGLE_SEARCH_API_KEY &&
    input.env.GOOGLE_SEARCH_ENGINE_ID
  ) {
    try {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${input.env.GOOGLE_SEARCH_API_KEY}&cx=${input.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=3`

      const response = await fetch(searchUrl)
      const data = (await response.json()) as {
        items?: Array<{ title?: string; snippet?: string; link?: string }>
        error?: { code: number; message: string }
      }

      if (data.items && data.items.length > 0) {
        searchResults = data.items.map((item) => ({
          title: item.title || '',
          snippet: item.snippet || '',
          link: item.link || '',
        }))
        searchPerformed = true
        answerSource = 'search'
      }
    } catch {
      searchPerformed = false
    }
  }

  // Generate answer based on available information
  if (searchPerformed && searchResults.length > 0) {
    // Determine how many results to use based on strategy
    let resultsToUse = searchResults

    if (input.answerStrategy === 'singular') {
      // For singular strategy, use only the best/first result
      resultsToUse = searchResults.slice(0, 1)
    } else {
      // For multiple strategy, use top 2-3 results
      resultsToUse = searchResults.slice(0, 2)
    }

    // Use selected results to generate answer
    const searchContext = resultsToUse
      .map((result) => `${result.title}: ${result.snippet}`)
      .join('\n\n')

    const searchAnswerPrompt = searchAnswerPrompts[promptMode]
      .replace('{searchContext}', searchContext)
      .replace('{question}', input.question)

    const searchAnswerResponse = await input.env.AI.run(model, {
      messages: [
        { role: 'system', content: searchAnswerPrompt },
        { role: 'user', content: input.question },
      ],
    })

    answerContent = searchAnswerResponse.response
  } else {
    // Fallback to knowledge-based answer
    const knowledgePrompt = knowledgeAnswerPrompts[promptMode]
      .replace('{coreContent}', input.coreContent)
      .replace('{question}', input.question)

    const knowledgeResponse = await input.env.AI.run(model, {
      messages: [
        { role: 'system', content: knowledgePrompt },
        { role: 'user', content: input.question },
      ],
    })

    answerContent = knowledgeResponse.response
    answerSource = 'knowledge'
  }

  const output = {
    answerContent,
    searchResults,
    searchPerformed,
    answerSource,
    actualSearchQuery: searchQuery,
  }

  console.log('SearchAnswer stage output:', {
    searchPerformed: output.searchPerformed,
    answerSource: output.answerSource,
    actualSearchQuery: output.actualSearchQuery,
    resultsCount: output.searchResults?.length || 0,
  })

  return output
}

export default searchAnswerStage
export type { SearchAnswerInput, SearchAnswerOutput }
