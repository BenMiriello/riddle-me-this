import { pipeline, Workflow } from '../Pipeline'
import {
  inputProcessingStage,
  searchAnswerStage,
  riddleResponseStage,
  type InputProcessingInput,
  type SearchAnswerInput,
  type RiddleResponseInput,
} from '../stages/v3'

// V3 default model - switching to non-thinking model for JSON output
const V3_DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct'
const V3_USES_THINKING = false

interface WorkflowV3Input {
  question: string
  searchRequested?: boolean
  runtime?: {
    workflowVariant?: string
  }
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
    AI_MODEL_USES_THINKING?: boolean
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

// Action word lists for UI
const actionWords = {
  generic: [
    'analyzing',
    'processing',
    'computing',
    'evaluating',
    'calculating',
    'resolving',
    'executing',
    'interpreting',
    'synthesizing',
    'deliberating',
    'examining',
    'inspecting',
    'reviewing',
    'assessing',
    'scanning',
    'parsing',
    'validating',
    'optimizing',
  ],
  riddleThemed: [
    'deciphering',
    'unraveling',
    'puzzling',
    'contemplating',
    'riddling',
    'mystifying',
    'pondering',
    'solving',
    'unveiling',
    'scrutinizing',
    'investigating',
    'deducing',
    'sleuthing',
    'detecting',
    'uncovering',
    'probing',
    'discovering',
    'revealing',
  ],
}

const completionVerbs = {
  inputProcessing: [
    'deciphered',
    'analyzed',
    'parsed',
    'interpreted',
    'understood',
    'classified',
  ],
  searchAnswer: [
    'searched',
    'discovered',
    'found',
    'retrieved',
    'located',
    'gathered',
  ],
  riddleResponse: [
    'crafted',
    'generated',
    'composed',
    'created',
    'formulated',
    'constructed',
  ],
}

// Helper function to get random action word
function getRandomActionWord(input: string): string {
  const allWords = [...actionWords.generic, ...actionWords.riddleThemed]
  const randomWord = allWords[Math.floor(Math.random() * allWords.length)]

  // Create contextual phrase based on input
  if (input.toLowerCase().includes('riddle')) {
    return `${randomWord} riddle`
  } else if (input.toLowerCase().includes('search')) {
    return `${randomWord} query`
  } else {
    return `${randomWord} input`
  }
}

// Helper function to get contextual completion phrase
function getCompletionPhrase(stage: string, data: any): string {
  const verbs = completionVerbs[stage as keyof typeof completionVerbs] || [
    'completed',
  ]
  const verb = verbs[Math.floor(Math.random() * verbs.length)]

  switch (stage) {
    case 'inputProcessing':
      if ((data as any).inputProcessing?.isRiddle) {
        return `${verb} riddle`
      } else if ((data as any).inputProcessing?.needsSearch) {
        return `${verb} query`
      } else {
        return `${verb} input`
      }
    case 'searchAnswer': {
      const resultCount = (data as any).searchAnswer?.searchResults?.length || 0
      if (resultCount > 0) {
        return `${verb} ${resultCount} result${resultCount === 1 ? '' : 's'}`
      } else {
        return `${verb} knowledge`
      }
    }
    case 'riddleResponse':
      return `${verb} response`
    default:
      return `${verb} task`
  }
}

// Helper function to determine if search should run
const shouldSearch = (pl: {
  inputProcessing: { result: { needsSearch: boolean } }
}): boolean => pl.inputProcessing.result.needsSearch

// Build the v3 workflow with yield points using unified pipeline
const WorkflowV3 = pipeline()
  .step('inputProcessing', (input: InputProcessingInput) =>
    inputProcessingStage({
      ...input,
      workflowVersion: 'v3',
      env: {
        ...input.env,
        AI_MODEL: input.env.AI_MODEL || V3_DEFAULT_MODEL,
        AI_MODEL_USES_THINKING: V3_USES_THINKING,
      },
    })
  )
  .yield(
    'input-complete',
    (data: any) => {
      const needsSearch = data.inputProcessing?.needsSearch || false
      const nextStep = needsSearch ? 'search-answer' : 'riddle-response'

      // Use LLM-generated action words when available, fallback to hard-coded ones
      let actionWord = needsSearch
        ? 'searching knowledge'
        : getRandomActionWord(data.webRequest?.question || '')
      let completedAction = getCompletionPhrase('inputProcessing', data)

      if (data.inputProcessing?.actionWords) {
        actionWord = needsSearch
          ? 'searching knowledge'
          : data.inputProcessing.actionWords.presentTense
        completedAction = data.inputProcessing.actionWords.pastTense
      }

      return {
        nextStep,
        actionWord,
        completedAction,
      }
    },
    { after: ['inputProcessing'] }
  )
  .step(
    'searchAnswer',
    (input: SearchAnswerInput) =>
      searchAnswerStage({
        ...input,
        env: {
          ...input.env,
          AI_MODEL: input.env.AI_MODEL || V3_DEFAULT_MODEL,
          AI_MODEL_USES_THINKING: V3_USES_THINKING,
        },
      }),
    {
      when: shouldSearch,
      after: ['inputProcessing'],
    }
  )
  .yield(
    'search-complete',
    (data: any) => {
      const resultCount = data.searchAnswer?.searchResults?.length || 0

      return {
        nextStep: 'riddle-response',
        actionWord: 'crafting response',
        completedAction: `found ${resultCount} result${resultCount === 1 ? '' : 's'}`,
      }
    },
    { after: ['searchAnswer'] }
  )
  .step(
    'riddleResponse',
    (input: RiddleResponseInput) =>
      riddleResponseStage({
        ...input,
        env: {
          ...input.env,
          AI_MODEL: input.env.AI_MODEL || V3_DEFAULT_MODEL,
          AI_MODEL_USES_THINKING: V3_USES_THINKING,
        },
      }),
    {
      after: ['inputProcessing', 'searchAnswer'],
    }
  )
  .build()

// Add simple execute method for unified API
const WorkflowV3WithExecute = {
  ...WorkflowV3,
  async execute(input: WorkflowV3Input) {
    // Use the unified Workflow's execute method for simple execution
    // This will run all steps to completion without session management
    return await (WorkflowV3 as Workflow).execute(input)
  },
}

export default WorkflowV3WithExecute
export type { WorkflowV3Input }
export {
  actionWords,
  completionVerbs,
  getRandomActionWord,
  getCompletionPhrase,
}
