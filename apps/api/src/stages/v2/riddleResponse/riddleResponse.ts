import { riddleGenerationPrompts, qualityAssessmentPrompts } from './prompts'

interface RiddleResponseInput {
  question: string
  isRiddle: boolean
  needsSearch: boolean
  processedInput: string
  riddleAnswer?: string
  riddleConfidence?: number
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
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    AI_MODEL?: string
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

interface RiddleResponseOutput {
  finalResponse: string
  responseType: 'riddle_answer' | 'generated_riddle' | 'stumper_response'
  badges: Array<{ type: string; earned: boolean; context?: string }>
  metadata: {
    originalInput: string
    processedInput: string
    answerUsed?: string
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

  // If input was a riddle and we have an answer, return it directly
  if (input.isRiddle && input.riddleAnswer) {
    if (input.riddleConfidence && input.riddleConfidence >= 50) {
      finalResponse = input.riddleAnswer
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
    // Generate riddle from answer content

    const riddleGenerationPrompt = riddleGenerationPrompts[promptMode].replace(
      '{answerToRiddlefy}',
      answerToRiddlefy
    )

    const riddleResponse = await input.env.AI.run(model, {
      messages: [
        { role: 'system', content: riddleGenerationPrompt },
        { role: 'user', content: answerToRiddlefy },
      ],
    })

    finalResponse = riddleResponse.response.trim()
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

      const qualityData = JSON.parse(qualityResponse.response)
      riddleQuality = qualityData.quality

      // Add quality-based badges
      if (qualityData.badges && Array.isArray(qualityData.badges)) {
        qualityData.badges.forEach((badgeType: string) => {
          badges.push({
            type: badgeType,
            earned: true,
            context: 'quality_assessment',
          })
        })
      }
    } catch (error) {
      console.log('Quality assessment error:', error)
    }
  }

  return {
    finalResponse,
    responseType,
    badges,
    metadata: {
      originalInput: input.question,
      processedInput: input.processedInput,
      answerUsed: input.answerContent || input.coreContent,
      riddleQuality,
    },
  }
}

export default riddleResponseStage
export type { RiddleResponseInput, RiddleResponseOutput }
