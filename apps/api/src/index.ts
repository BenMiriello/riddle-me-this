import { Hono } from 'hono'
import { cors } from 'hono/cors'
import packageJson from '../../../package.json'

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
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('RiddleMeThis API')
})

app.get('/health', (c) => {
  const environment = c.env.ENVIRONMENT || 'production'
  const isProduction = environment === 'production'

  let version = packageJson.version
  if (!isProduction) {
    const gitSha = process.env.CF_PAGES_COMMIT_SHA || 'unknown'
    version = `dev@${gitSha.substring(0, 7)}`
  }

  return c.json({
    status: 'healthy',
    version: version,
    buildTime: new Date().toISOString(),
    environment: environment,
  })
})

app.post('/riddle', async (c) => {
  try {
    const { question } = await c.req.json()

    if (!question) {
      return c.json({ error: 'Question is required' }, 400)
    }

    // 5 criteria for riddle detection - format as evaluatable object
    const riddleCriteria = `
    Evaluate these 5 criteria and respond with this exact format:
    RIDDLE_EVAL: { "hasRhyme": boolean, "hasMetaphor": boolean, "hasImplicitSubject": boolean, "hasPlayfulLanguage": boolean, "hasStructure": boolean }

    Criteria:
    1. hasRhyme: Contains rhyming words or patterns
    2. hasMetaphor: Uses metaphorical or indirect references instead of literal terms
    3. hasImplicitSubject: The main subject is hidden/veiled rather than explicitly stated
    4. hasPlayfulLanguage: Uses archaic, whimsical, or mysterious phrasing
    5. hasStructure: Follows a poetic structure (couplets, verses, etc.)
    `

    // Note: we want to add more granularity to the structure later (not yet),
    // such as 'iambic pentameter' (bard badge) or 'haiku' or other

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

    // Step 0: Determine if search is needed
    const searchDetectionResponse = await c.env.AI.run(
      '@cf/meta/llama-3-8b-instruct',
      {
        messages: [
          {
            role: 'system',
            content: `Determine if this question requires current information from the web. Respond with only "SEARCH" or "KNOWLEDGE".

SEARCH for:
- Current events, news, or recent information
- Location-based queries (near me, in [city])
- Real-time data (weather, stock prices, movie showtimes)
- Recent developments or updates

KNOWLEDGE for:
- General facts, definitions, explanations
- Historical information
- Math, science, concepts
- How-to questions with established answers

Respond with only one word: SEARCH or KNOWLEDGE`,
          },
          { role: 'user', content: question },
        ],
      }
    )

    const needsSearch = searchDetectionResponse.response
      .trim()
      .toUpperCase()
      .includes('SEARCH')

    console.log('Environment check:')
    console.log('needsSearch:', needsSearch)
    console.log('Has API key:', !!c.env.GOOGLE_SEARCH_API_KEY)
    console.log('API key length:', c.env.GOOGLE_SEARCH_API_KEY?.length || 0)
    console.log('Has Search Engine ID:', !!c.env.GOOGLE_SEARCH_ENGINE_ID)

    // Step 1: Generate answer (with or without search)
    let answerResponse
    let searchResults: Array<{ title: string; snippet: string; link: string }> =
      []
    if (needsSearch && c.env.GOOGLE_SEARCH_API_KEY) {
      try {
        const searchQuery = encodeURIComponent(question)
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${c.env.GOOGLE_SEARCH_API_KEY}&cx=${c.env.GOOGLE_SEARCH_ENGINE_ID}&q=${searchQuery}&num=3`

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
              content: `Question: ${question}\n\nSource: ${searchContext}\n\nAnswer:`,
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
            { role: 'user', content: question },
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
          { role: 'user', content: question },
        ],
      })
    }

    // Step 2: Evaluate if input was a riddle
    const evaluationResponse = await c.env.AI.run(
      '@cf/meta/llama-3-8b-instruct',
      {
        messages: [
          {
            role: 'system',
            content: `Evaluate if this question is written as a riddle. Look carefully for:
- Metaphors or indirect references ("canvas of connections" = metaphor)
- Mysterious/whimsical language ("where thoughts and faces blend" = playful)
- Hidden subjects (not stating the thing directly)

${riddleCriteria}

Respond with only the JSON object, nothing else.`,
          },
          { role: 'user', content: question },
        ],
      }
    )

    // Parse riddle evaluation
    let inputWasRiddle = false
    try {
      const evalMatch = evaluationResponse.response.match(
        /{\s*"hasRhyme"[\s\S]*?}/
      )
      if (evalMatch) {
        const evalObj = JSON.parse(evalMatch[0])
        const trueCount = Object.values(evalObj).filter(
          (v) => v === true
        ).length
        inputWasRiddle = trueCount >= 2
      }
    } catch {
      // If evaluation fails, assume not a riddle
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
      searchQuery: needsSearch ? question : null,
      searchResults: searchResults,
      primarySource: searchResults[0] || null,
      searchPerformed: needsSearch && !!c.env.GOOGLE_SEARCH_API_KEY,
      evaluation: evaluationResponse.response,
    })
  } catch (error) {
    console.error('Error:', error)
    return c.json({ error: 'Failed to process question' }, 500)
  }
})

export default app
