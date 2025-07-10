interface InputProcessingInput {
  question: string
  searchRequested?: boolean
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

interface InputProcessingOutput {
  isRiddle: boolean
  needsSearch: boolean
  processedInput: string
  riddleAnswer?: string
  riddleConfidence?: number
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
  badges: Array<{
    type: string
    earned: boolean
    context?: string
  }>
  evaluation: {
    needsSearch: 'SEARCH' | 'NO_SEARCH'
    riddleEval: {
      hasRhyme: boolean
      hasMetaphor: boolean
      hasImplicitSubject: boolean
      hasPlayfulLanguage: boolean
      hasStructure: boolean
    }
  }
  answerStrategy: 'singular' | 'multiple'
  answerStrategyReasoning: string
}

import { inputProcessingPrompts } from './prompts'

const inputProcessingStage = async (
  input: InputProcessingInput
): Promise<InputProcessingOutput> => {
  const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
  const promptMode = input.env.RIDDLE_PROMPT_MODE || 'concise'

  // Initialize output with defaults
  let isRiddle = false
  let needsSearch = false
  const processedInput = input.question
  let riddleAnswer: string | undefined
  let riddleConfidence: number | undefined
  let searchableAnswer: string | undefined
  let userIntent = 'General information seeking'
  let inputType:
    | 'question'
    | 'url'
    | 'procedural'
    | 'numerical'
    | 'comparative'
    | 'descriptive'
    | 'transactional' = 'question'
  let coreContent = input.question
  const badges: Array<{ type: string; earned: boolean; context?: string }> = []
  let evaluation = {
    needsSearch: 'NO_SEARCH' as 'SEARCH' | 'NO_SEARCH',
    riddleEval: {
      hasRhyme: false,
      hasMetaphor: false,
      hasImplicitSubject: false,
      hasPlayfulLanguage: false,
      hasStructure: false,
    },
  }
  let answerStrategy: 'singular' | 'multiple' = 'multiple'
  let answerStrategyReasoning = 'Default multiple answer approach'

  // Single comprehensive LLM call that handles everything
  const inputPrompt = inputProcessingPrompts[promptMode]

  try {
    const response = await input.env.AI.run(model, {
      messages: [
        { role: 'system', content: inputPrompt },
        { role: 'user', content: input.question },
      ],
    })

    let responseText = response.response.trim()

    // Try to extract JSON if there's extra text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      responseText = jsonMatch[0]
    }

    const result = JSON.parse(responseText)

    // Extract basic classification
    inputType = result.inputType || 'question'
    isRiddle = result.isRiddle || false

    // Handle needsSearch: user requested OR system determined
    const systemDeterminedSearch = result.needsSearch || false
    needsSearch = input.searchRequested || systemDeterminedSearch

    coreContent = result.coreContent || input.question

    // Handle riddle analysis and solving
    if (result.riddleAnalysis) {
      riddleConfidence = result.riddleAnalysis.confidence || 0
      if (riddleConfidence && riddleConfidence >= 50) {
        isRiddle = true
        riddleAnswer = result.riddleAnalysis.answer
        searchableAnswer = result.riddleAnalysis.searchableAnswer

        // Fallback for missing searchableAnswer on weather queries
        if (
          !searchableAnswer &&
          needsSearch &&
          input.question.toLowerCase().includes('weather')
        ) {
          const locationMatch = input.question.match(
            /in\s+([^?]+?)(?:\s+today|\s+now|$|\?)/i
          )
          if (locationMatch) {
            const location = locationMatch[1].trim()
            searchableAnswer = `weather in ${location}`
          }
        }

        // Use riddle answer as core content if solved
        if (riddleAnswer) {
          coreContent = riddleAnswer
        }
      }
    }

    // Extract user intent
    if (result.userIntent) {
      userIntent = result.userIntent
    }

    // Handle URL distillation
    if (inputType === 'url' && result.urlDistillation) {
      if (result.urlDistillation.riddleability >= 50) {
        coreContent = result.coreContent // Already processed by comprehensive prompt
      }
      needsSearch = true // Always search for URL content
    }

    // Handle complex input distillation
    if (
      (inputType === 'descriptive' ||
        inputType === 'procedural' ||
        inputType === 'comparative') &&
      result.complexDistillation
    ) {
      if (result.complexDistillation.riddleability >= 50) {
        coreContent = result.coreContent // Already processed by comprehensive prompt
      }
    }

    // Add all badges detected by comprehensive analysis
    if (result.badges && Array.isArray(result.badges)) {
      result.badges.forEach((badgeType: string) => {
        badges.push({
          type: badgeType,
          earned: true,
          context: 'comprehensive_analysis',
        })
      })
    }

    // Extract evaluation
    if (result.evaluation) {
      evaluation = {
        needsSearch: result.evaluation.needsSearch || 'NO_SEARCH',
        riddleEval: result.evaluation.riddleEval || evaluation.riddleEval,
      }
    }

    // Extract answer strategy
    if (result.answerStrategy) {
      answerStrategy = result.answerStrategy
      answerStrategyReasoning =
        result.answerStrategyReasoning || 'No reasoning provided'
      console.log(
        'Strategy extracted from comprehensive prompt:',
        answerStrategy,
        '-',
        answerStrategyReasoning
      )
    } else {
      console.log(
        'No answerStrategy found in result, using default:',
        answerStrategy
      )
    }
  } catch (error) {
    console.log('Comprehensive processing error:', error)

    // Fallback to simpler analysis
    try {
      const fallbackResponse = await input.env.AI.run(model, {
        messages: [
          {
            role: 'system',
            content:
              'Respond with only valid JSON. Determine if this needs web search (current events, recent data, specific facts) or is a riddle (has "I am/have", metaphors, "What am I?"). Format: {"inputType": "question", "isRiddle": false, "needsSearch": false, "coreContent": "extracted concept", "badges": []}',
          },
          { role: 'user', content: input.question },
        ],
      })

      const fallbackResult = JSON.parse(fallbackResponse.response)
      inputType = fallbackResult.inputType || 'question'

      // Handle needsSearch: user requested OR system determined
      const systemDeterminedSearch = fallbackResult.needsSearch || false
      needsSearch = input.searchRequested || systemDeterminedSearch

      isRiddle = fallbackResult.isRiddle || false
      coreContent = fallbackResult.coreContent || input.question
    } catch (fallbackError) {
      console.log('Fallback processing error:', fallbackError)
      // Final fallback to basic processing
      inputType = 'question'
      coreContent = input.question
      needsSearch = input.searchRequested || false
      isRiddle = false
    }
  }

  const output = {
    isRiddle,
    needsSearch,
    processedInput,
    riddleAnswer,
    riddleConfidence,
    searchableAnswer,
    userIntent,
    inputType,
    coreContent,
    badges,
    evaluation,
    answerStrategy,
    answerStrategyReasoning,
  }

  console.log('InputProcessing stage output:', {
    isRiddle: output.isRiddle,
    needsSearch: output.needsSearch,
    userIntent: output.userIntent,
    searchableAnswer: output.searchableAnswer,
  })

  return output
}

export default inputProcessingStage
export type { InputProcessingInput, InputProcessingOutput }
