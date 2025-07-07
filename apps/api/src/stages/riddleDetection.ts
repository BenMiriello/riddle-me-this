interface DetectionInput {
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
}

interface DetectionOutput {
  needsSearch: boolean
  inputWasRiddle: boolean
  detectionResponse: string
}

const detectionStage = async ({
  question,
  env,
}: DetectionInput): Promise<DetectionOutput> => {
  const model = env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
  const detectionResponse = await env.AI.run(model, {
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
  })

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
    needsSearch = false
    inputWasRiddle = false
  }

  return {
    needsSearch,
    inputWasRiddle,
    detectionResponse: detectionResponse.response,
  }
}

export default detectionStage
export type { DetectionInput, DetectionOutput }
