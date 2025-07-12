import { qualityAssessmentPrompts } from './prompts'

interface RiddleResponseInput {
  question: string
  isRiddle: boolean
  needsSearch: boolean
  processedInput: string
  riddleAnswer?: string
  riddleConfidence?: number
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
  badges: Array<{ type: string; earned: boolean; context?: string }>
  answerContent?: string
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  searchPerformed?: boolean
  answerSource?: 'search' | 'knowledge' | 'riddle_answer'
  actualSearchQuery?: string
  answerStrategy?: 'singular' | 'multiple'
  answerStrategyReasoning?: string
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    AI_MODEL?: string
    AI_MODEL_USES_THINKING?: boolean
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

interface SingleRiddleResult {
  finalResponse: string
  responseType: 'riddle_answer' | 'generated_riddle' | 'stumper_response'
  riddleTarget?: string
  riddleQuality?: number
  sourceResult?: { title: string; snippet: string; link: string }
}

interface RiddleResponseOutput {
  // For backward compatibility and singular results
  finalResponse: string
  responseType: 'riddle_answer' | 'generated_riddle' | 'stumper_response'

  // New: Multiple riddle results
  riddles?: SingleRiddleResult[]

  badges: Array<{ type: string; earned: boolean; context?: string }>
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  searchPerformed?: boolean
  answerSource?: 'search' | 'knowledge' | 'riddle_answer'
  actualSearchQuery?: string
  answerStrategy?: 'singular' | 'multiple'
  answerStrategyReasoning?: string
  metadata: {
    originalInput: string
    processedInput: string
    answerUsed?: string
    riddleTarget?: string
    riddleQuality?: number
  }
}

const riddleResponseStage = async (
  input: RiddleResponseInput
): Promise<RiddleResponseOutput> => {
  const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
  const promptMode = input.env.RIDDLE_PROMPT_MODE || 'concise'

  let finalResponse = ''
  let responseType: 'riddle_answer' | 'generated_riddle' | 'stumper_response' =
    'generated_riddle'
  const badges = [...input.badges]
  const answerToRiddlefy =
    input.answerContent || input.coreContent || input.question
  let riddleTarget = ''

  // If input was a riddle and we have an answer, but also check for rich content
  if (input.isRiddle && input.riddleAnswer) {
    if (input.riddleConfidence && input.riddleConfidence >= 50) {
      // If we have rich content from search, use it to create a better response
      if (input.answerContent && input.answerContent.trim().length > 0) {
        // Create ideal solution using userIntent + rich content
        const idealSolutionPrompt = `Create an ideal solution for a riddle based on the user's intent and the rich information we found.

User Intent: ${input.userIntent}
Rich Information: ${input.answerContent}
Original Riddle Answer: ${input.riddleAnswer}

Generate a complete, informative solution that:
1. Actually answers what the user wants to know (based on their intent)
2. Uses the rich information we found
3. Is suitable as the answer to a riddle

Return ONLY the ideal solution text, nothing else:`

        try {
          const idealSolutionResponse = await input.env.AI.run(model, {
            messages: [
              { role: 'system', content: idealSolutionPrompt },
              {
                role: 'user',
                content: `Intent: ${input.userIntent}\nRich Info: ${input.answerContent}`,
              },
            ],
          })

          const idealSolution = idealSolutionResponse.response.trim()

          // Now generate a riddle that leads to this ideal solution
          const enhancedRiddlePrompt = `Create a riddle that leads to this specific solution. The riddle should incorporate the key elements from the solution.

User Intent: ${input.userIntent}
Ideal Solution: ${idealSolution}

Create a riddle using these principles:
- Use "I am/have/can" format or metaphorical descriptions
- Include specific details from the solution (numbers, conditions, etc.)
- Make it solvable through logical deduction
- 2-4 lines maximum
- The answer should be the ideal solution

Return EXACTLY this JSON format:
{
  "riddle": "the riddle text only",
  "target": "brief description of what the riddle is about"
}`

          const enhancedRiddleResponse = await input.env.AI.run(model, {
            messages: [
              { role: 'system', content: enhancedRiddlePrompt },
              { role: 'user', content: `Solution: ${idealSolution}` },
            ],
          })

          let riddleResponseText = enhancedRiddleResponse.response.trim()
          const jsonMatch = riddleResponseText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            riddleResponseText = jsonMatch[0]
          }

          const riddleResult = JSON.parse(riddleResponseText)
          finalResponse = riddleResult.riddle || idealSolution
          riddleTarget = riddleResult.target || 'enhanced_riddle'
        } catch {
          // Fallback to using the rich content directly
          finalResponse = input.answerContent
        }
      } else {
        // No rich content, use original riddle answer
        finalResponse = input.riddleAnswer
      }

      responseType = 'riddle_answer'
      badges.push({
        type: 'riddle_solver',
        earned: true,
        context: 'solved_user_riddle',
      })
    } else {
      // Low confidence or stumper case
      finalResponse =
        'A puzzling riddle indeed! I find myself stumped by your clever creation.'
      responseType = 'stumper_response'
      badges.push({ type: 'tree_stump', earned: true, context: 'ai_stumped' })
    }
  } else {
    // Check if we should generate multiple riddles (all in one step)
    if (
      input.answerStrategy === 'multiple' &&
      input.searchResults &&
      input.searchResults.length > 0
    ) {
      // Build combined prompt with all search results
      const combinedContent = input.searchResults
        .map(
          (result, index) =>
            `Result ${index + 1}: ${result.title} - ${result.snippet}`
        )
        .join('\n\n')

      const multipleRiddlePrompt = `Generate ${input.searchResults.length} riddles from these search results. Each riddle should target a different concrete element from each result.

Search Results:
${combinedContent}

User Question: ${input.question}

Return EXACTLY this JSON format:
{
  "riddles": [
    {
      "target": "target from result 1",
      "riddle": "riddle text for result 1", 
      "resultIndex": 0
    },
    {
      "target": "target from result 2", 
      "riddle": "riddle text for result 2",
      "resultIndex": 1
    },
    {
      "target": "target from result 3",
      "riddle": "riddle text for result 3", 
      "resultIndex": 2
    }
  ]
}`

      try {
        const riddleResponse = await input.env.AI.run(model, {
          messages: [
            { role: 'system', content: multipleRiddlePrompt },
            { role: 'user', content: combinedContent },
          ],
        })

        let responseText = riddleResponse.response.trim()
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          responseText = jsonMatch[0]
        }

        const riddleResults = JSON.parse(responseText)

        const multipleRiddles: SingleRiddleResult[] = riddleResults.riddles.map(
          (riddle: { riddle?: string; target?: string }, index: number) => ({
            finalResponse: riddle.riddle || 'Failed to generate riddle',
            responseType: 'generated_riddle' as const,
            riddleTarget: riddle.target || 'unknown',
            riddleQuality: undefined,
            sourceResult:
              input.searchResults![index] || input.searchResults![0],
          })
        )

        // Add badges for riddle generation
        badges.push({
          type: 'riddle_master',
          earned: true,
          context: `generated_${multipleRiddles.length}_riddles`,
        })

        const riddleTarget = multipleRiddles[0]?.riddleTarget || 'unknown'
        const riddleQuality = multipleRiddles[0]?.riddleQuality

        return {
          finalResponse:
            multipleRiddles[0]?.finalResponse || 'Failed to generate riddles',
          responseType: 'generated_riddle' as const,
          riddles: multipleRiddles,
          badges,
          searchResults: input.searchResults || [],
          searchPerformed: input.searchPerformed || false,
          answerSource: input.answerSource || 'knowledge',
          actualSearchQuery: input.actualSearchQuery,
          answerStrategy: input.answerStrategy,
          answerStrategyReasoning: input.answerStrategyReasoning,
          metadata: {
            originalInput: input.question,
            processedInput: input.processedInput,
            answerUsed: input.answerContent || input.coreContent,
            riddleTarget,
            riddleQuality,
          },
        }
      } catch {
        // Fall back to single riddle
      }
    }

    // Generate single riddle with enhanced prompt for minimal input handling

    const enhancedRiddlePrompt = `You must create a riddle following these steps. When given minimal input, use your knowledge to expand on the concept.

STEP 1: Input Enhancement
If the answer is minimal (1-2 words like "rain", "weather", "fog"), expand it using your knowledge:
- Rain → water droplets falling from clouds, wet, refreshing, creates puddles, helps plants grow
- Weather → atmospheric conditions, changes daily, affects mood, measured by instruments
- Fog → water vapor, reduces visibility, mysterious, rolls in from sea, dissipates with sun

STEP 2: Target Selection  
From the enhanced understanding, choose the most concrete, riddleable element:
- AVOID: Abstract concepts (climate, patterns, temperatures, general descriptions)
- CHOOSE: Concrete things people can experience, touch, see, or interact with

Examples:
- "rain" → Target: "raindrop" (concrete, tangible)
- "weather" → Target: "barometer" or "thermometer" (concrete instruments)
- "fog" → Target: "mist" (concrete, visible phenomenon)

STEP 3: Riddle Creation
Create a riddle about your target using these principles:
- Use "I am/have/can" format or metaphorical descriptions
- Create contradictions or paradoxes about its nature  
- Make it solvable through logical deduction
- 2-4 lines maximum
- No meta-commentary or introductions

User Question: ${input.question}
User Intent: ${input.userIntent}
Answer to work with: ${answerToRiddlefy}

Return EXACTLY this JSON format:
{
  "target": "selected target (1-2 words)",
  "riddle": "the riddle text only",
  "reasoning": "brief explanation of target choice and enhancement"
}`

    const riddleResponse = await input.env.AI.run(model, {
      messages: [
        { role: 'system', content: enhancedRiddlePrompt },
        {
          role: 'user',
          content: `Question: ${input.question}\nUser Intent: ${input.userIntent}\nAnswer: ${answerToRiddlefy}`,
        },
      ],
    })

    try {
      let responseText = riddleResponse.response.trim()

      // Try to extract JSON if there's extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        responseText = jsonMatch[0]
      }

      const riddleResult = JSON.parse(responseText)
      finalResponse = riddleResult.riddle || 'Failed to generate riddle'
      riddleTarget = riddleResult.target || 'unknown'
    } catch {
      // Fallback to simple riddle generation
      finalResponse = 'A mystery wrapped in an enigma, what could I be?'
      riddleTarget = 'fallback'
    }

    responseType = 'generated_riddle'

    // Badge for riddle generation
    badges.push({
      type: 'riddle_master',
      earned: true,
      context: 'generated_riddle',
    })

    // Additional badges based on input type
    if (input.inputType === 'url') {
      badges.push({
        type: 'web_weaver',
        earned: true,
        context: 'url_to_riddle',
      })
    }
    if (
      input.inputType === 'procedural' ||
      input.inputType === 'comparative' ||
      input.inputType === 'descriptive'
    ) {
      badges.push({
        type: 'complexity_tamer',
        earned: true,
        context: 'complex_to_riddle',
      })
    }
    if (input.searchPerformed) {
      badges.push({
        type: 'search_scholar',
        earned: true,
        context: 'used_web_search',
      })
    }
  }

  // Quality assessment for generated riddles
  let riddleQuality: number | undefined
  if (responseType === 'generated_riddle') {
    const qualityPrompt = qualityAssessmentPrompts[promptMode]
      .replace('{riddle}', finalResponse)
      .replace('{answer}', answerToRiddlefy)

    try {
      const qualityResponse = await input.env.AI.run(model, {
        messages: [
          { role: 'system', content: qualityPrompt },
          { role: 'user', content: finalResponse },
        ],
      })

      let responseText = qualityResponse.response.trim()

      // Try multiple JSON extraction methods
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        responseText = jsonMatch[0]
      }

      // Clean up common JSON issues
      responseText = responseText
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control characters
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays

      let qualityData
      try {
        qualityData = JSON.parse(responseText)
        riddleQuality = qualityData.quality
      } catch {
        // Skip quality assessment if JSON is malformed
        riddleQuality = undefined
      }

      // Add quality-based badges
      if (
        qualityData &&
        qualityData.badges &&
        Array.isArray(qualityData.badges)
      ) {
        qualityData.badges.forEach((badgeType: string) => {
          badges.push({
            type: badgeType,
            earned: true,
            context: 'quality_assessment',
          })
        })
      }
    } catch {
      // Quality assessment failed, continue without it
    }
  }

  const output = {
    finalResponse,
    responseType,
    badges,
    searchResults: input.searchResults || [],
    searchPerformed: input.searchPerformed || false,
    answerSource: input.answerSource || 'knowledge',
    actualSearchQuery: input.actualSearchQuery,
    answerStrategy: input.answerStrategy,
    answerStrategyReasoning: input.answerStrategyReasoning,
    metadata: {
      originalInput: input.question,
      processedInput: input.processedInput,
      answerUsed: input.answerContent || input.coreContent,
      riddleTarget,
      riddleQuality,
    },
  }

  console.log('RiddleResponse stage output:', {
    responseType: output.responseType,
    riddleTarget,
    riddleQuality,
    badgeCount: output.badges.length,
  })

  return output
}

export default riddleResponseStage
export type { RiddleResponseInput, RiddleResponseOutput }
