import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Version will be injected via Cloudflare environment variable
// For now, hardcoded to 'dev' for development

interface Env {
  AI: {
    run: (
      model: string,
      options: {
        messages: Array<{ role: string; content: string }>
      }
    ) => Promise<{ response: string }>
  }
  GOOGLE_SEARCH_API_KEY?: string
  GOOGLE_SEARCH_ENGINE_ID?: string
  ENVIRONMENT?: string
  APP_VERSION?: string
  CF_PAGES_COMMIT_SHA?: string
  GITHUB_SHA?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('RiddleMeThis API')
})

app.get('/health', (c) => {
  try {
    const environment = c.env.ENVIRONMENT || 'production'
    const isProduction = environment === 'production'

    let version = c.env.APP_VERSION || 'dev'
    if (!isProduction) {
      // Get git SHA from Cloudflare environment
      const gitSha = c.env.CF_PAGES_COMMIT_SHA || c.env.GITHUB_SHA || '7a3b054' // Current commit as fallback
      version = `dev@${gitSha.substring(0, 7)}`
    }

    return c.json({
      status: 'healthy',
      version: version,
      buildTime: new Date().toISOString(),
      environment: environment,
    })
  } catch (error) {
    return c.json({ error: 'Health check failed', details: String(error) }, 500)
  }
})

app.post('/riddle', async (c) => {
  try {
    const { question } = await c.req.json()

    if (!question) {
      return c.json({ error: 'Question is required' }, 400)
    }

    // Note: we want to add more granularity to the structure later (not yet),
    // such as 'iambic pentameter' (bard badge) or 'haiku' or other

    // Idea: Use that list of best riddles as examples to develop better prompting
    // But also use them as autosuggestions
    // And include easter eggs for famous riddles like "what have I got in my pocket" with some response that honors the source

    const howToWriteARiddle = `
    Write a SHORT riddle (2-4 lines maximum) that:
    1. MUST clearly hint at the specific answer provided
    2. Uses metaphor or imagery instead of direct terms
    3. Has a tone of mischief, intrigue, mystery, playfulness
    4. Is solvable - someone should be able to guess the specific answer
    5. Avoids being just poetry about the topic
    6. Hints at or uses in some rephrased or artfully obscured way an identifiable or defining characteristic of the real answer.

    The riddle must lead to the exact answer given, not just be related to the topic.
    Format: Present it as a riddle question, not a statement.
    Length: 2-4 lines only. Be concise!
    `

    // Step 0: Combined detection - search needs AND riddle evaluation in one call
    const detectionResponse = await c.env.AI.run(
      '@cf/meta/llama-3-8b-instruct',
      {
        messages: [
          {
            role: 'system',
            content: `Analyze this question and respond with EXACTLY this JSON format:

{
  "needsSearch": "SEARCH" | "KNOWLEDGE",
  "riddleEval": {
    "hasRhyme": boolean,
    "hasMetaphor": boolean,
    "hasImplicitSubject": boolean,
    "hasPlayfulLanguage": boolean,
    "hasStructure": boolean
  }
}

SEARCH vs KNOWLEDGE:
- SEARCH for: current events, news, location-based queries, real-time data, recent developments
- KNOWLEDGE for: general facts, definitions, historical info, math/science concepts, how-to questions

Riddle criteria:
1. hasRhyme: Contains rhyming words or patterns
2. hasMetaphor: Uses metaphorical or indirect references instead of literal terms
3. hasImplicitSubject: The main subject is hidden/veiled rather than explicitly stated
4. hasPlayfulLanguage: Uses archaic, whimsical, or mysterious phrasing
5. hasStructure: Follows a poetic structure (couplets, verses, etc.)

Respond with ONLY the JSON object, nothing else.`,
          },
          { role: 'user', content: question },
        ],
      }
    )

    // Parse combined detection response
    let needsSearch = false
    let inputWasRiddle = false
    try {
      const detectionData = JSON.parse(detectionResponse.response)
      needsSearch = detectionData.needsSearch === 'SEARCH'

      if (detectionData.riddleEval) {
        const trueCount = Object.values(detectionData.riddleEval).filter(
          (v) => v === true
        ).length
        inputWasRiddle = trueCount >= 2
      }
    } catch (error) {
      console.log('Detection parsing error:', error)
      // Fallback: assume knowledge-based and not a riddle
      needsSearch = false
      inputWasRiddle = false
    }

    console.log('Environment check:')
    console.log('needsSearch:', needsSearch)
    console.log('inputWasRiddle:', inputWasRiddle)
    console.log('Has API key:', !!c.env.GOOGLE_SEARCH_API_KEY)
    console.log('API key length:', c.env.GOOGLE_SEARCH_API_KEY?.length || 0)
    console.log('Has Search Engine ID:', !!c.env.GOOGLE_SEARCH_ENGINE_ID)

    // Step 1: Decipher riddle if input was a riddle
    let searchQuery = question
    let riddleDecipherResponse = null
    if (inputWasRiddle) {
      riddleDecipherResponse = await c.env.AI.run(
        '@cf/meta/llama-3-8b-instruct',
        {
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
            { role: 'user', content: question },
          ],
        }
      )

      try {
        const decipherData = JSON.parse(riddleDecipherResponse.response)
        if (decipherData.confidence >= 50) {
          searchQuery = decipherData.answer
        } else {
          // Low confidence: combine answer with key terms
          searchQuery = `${decipherData.answer} ${decipherData.keyTerms.join(' ')}`
        }
        console.log('Riddle deciphered:', decipherData)
        console.log('Search query:', searchQuery)
      } catch (error) {
        console.log('Riddle decipher parsing error:', error)
        console.log('Raw riddle response:', riddleDecipherResponse.response)
        // Fallback: use original question
        searchQuery = question
      }
    }

    // Step 2: Generate answer (with or without search)
    let answerResponse
    let searchResults: Array<{ title: string; snippet: string; link: string }> =
      []
    if (needsSearch && c.env.GOOGLE_SEARCH_API_KEY) {
      try {
        const encodedSearchQuery = encodeURIComponent(searchQuery)
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${c.env.GOOGLE_SEARCH_API_KEY}&cx=${c.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodedSearchQuery}&num=3`

        const searchResponse = await fetch(searchUrl)
        const searchData = (await searchResponse.json()) as {
          items?: Array<{ title: string; snippet: string; link: string }>
        }

        console.log('Search response status:', searchResponse.status)
        console.log('Search data:', JSON.stringify(searchData, null, 2))

        searchResults =
          searchData.items
            ?.slice(0, 3)
            .map((item: { title: string; snippet: string; link: string }) => ({
              title: item.title,
              snippet: item.snippet,
              link: item.link,
            })) || []

        console.log('Processed search results:', searchResults)

        // Generate answer using primary source (first result)
        const primarySource = searchResults[0]
        const searchContext = `${primarySource.title}: ${primarySource.snippet}`

        answerResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            {
              role: 'system',
              content:
                'Using this specific source, answer the question directly and concisely. Focus on the information from this source. Be brief.',
            },
            {
              role: 'user',
              content: `Question: ${searchQuery}\n\nSource: ${searchContext}\n\nAnswer:`,
            },
          ],
        })
      } catch (searchError) {
        console.log('Search error:', searchError)
        // Fallback to knowledge-based answer if search fails
        answerResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            {
              role: 'system',
              content:
                'This question requires current information, but search is unavailable. Provide the best general answer you can.',
            },
            { role: 'user', content: searchQuery },
          ],
        })
      }
    } else {
      // Use knowledge-based answer
      answerResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content:
              'Answer directly and concisely. Be brief. Give only essential information. No fluff or explanations unless necessary.',
          },
          { role: 'user', content: searchQuery },
        ],
      })
    }

    // Step 3: Generate riddle if input wasn't a riddle
    let riddleResponse = ''
    if (!inputWasRiddle) {
      const riddleResult = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: `Transform this answer into a short riddle. Requirements:
${howToWriteARiddle}
Return ONLY the riddle, nothing else. Maximum 4 lines.`,
          },
          { role: 'user', content: answerResponse.response },
        ],
      })
      riddleResponse = riddleResult.response
    }

    const finalResponse = inputWasRiddle
      ? answerResponse.response
      : riddleResponse

    console.log('Final searchResults being returned:', searchResults)

    return c.json({
      answer: answerResponse.response,
      riddle: riddleResponse || answerResponse.response,
      response: finalResponse,
      inputWasRiddle: inputWasRiddle,
      needsSearch: needsSearch,
      searchQuery: needsSearch ? searchQuery : null,
      originalQuestion: question,
      searchResults: searchResults,
      primarySource: searchResults[0] || null,
      searchPerformed: needsSearch && !!c.env.GOOGLE_SEARCH_API_KEY,
      evaluation: detectionResponse.response,
      riddleDecipher: riddleDecipherResponse?.response || null,
    })
  } catch (error) {
    console.error('Error:', error)
    return c.json({ error: 'Failed to process question' }, 500)
  }
})

export default app
