import { pipeline } from '../Pipeline'
import {
  inputProcessingStage,
  searchAnswerStage,
  riddleResponseStage,
  type InputProcessingOutput,
  type SearchAnswerOutput,
  type RiddleResponseOutput,
} from '../stages/v2'

interface WorkflowV2Input {
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
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

// Infer workflow output type from pipeline execution
type WorkflowV2Output = {
  webRequest: WorkflowV2Input
  inputProcessing: InputProcessingOutput
  searchAnswer?: SearchAnswerOutput
  riddleResponse: RiddleResponseOutput
}

// API Response Types

interface V2RiddleResponse {
  answer: string
  riddle: string
  response: string
  inputWasRiddle: boolean
  needsSearch: boolean
  searchPerformed: boolean
  searchQuery: string
  searchResults: Array<{ title: string; snippet: string; link: string }>
  primarySource: { title: string; snippet: string; link: string } | null
  badges: Array<{ type: string; earned: boolean; context?: string }>
  evaluation: string
  riddles?: Array<{
    finalResponse: string
    responseType: string
    riddleTarget?: string
    riddleQuality?: number
    sourceResult?: { title: string; snippet: string; link: string }
  }> | null
  debug?: {
    riddleTarget: string
    answerSource: string
    processedInput: string
    riddleQuality?: number
    actualSearchQuery: string
    answerStrategy: string
    answerStrategyReasoning: string
    multipleRiddlesCount: number
    searchRequested: boolean
  }
}

// Workflow V2 API Adapters
const workflowV2Adapters = {
  toApiV2: (result: WorkflowV2Output): V2RiddleResponse => ({
    // Core API fields
    answer: result.searchAnswer?.answerContent || '',
    riddle: result.riddleResponse?.finalResponse || '',
    response: result.riddleResponse?.finalResponse || '',
    inputWasRiddle: result.riddleResponse?.responseType === 'riddle_answer',
    needsSearch: result.inputProcessing?.needsSearch || false,
    searchPerformed: result.searchAnswer?.searchPerformed || false,
    searchQuery: result.webRequest?.question || '',
    searchResults: result.searchAnswer?.searchResults || [],
    primarySource: result.searchAnswer?.searchResults?.[0] || null,
    badges: result.riddleResponse?.badges || [],
    evaluation: result.inputProcessing?.evaluation?.needsSearch || 'NO_SEARCH',

    // V2 enhancements
    riddles: result.riddleResponse?.riddles || null,
    debug: {
      riddleTarget: result.riddleResponse?.metadata?.riddleTarget || 'unknown',
      answerSource: result.searchAnswer?.answerSource || 'knowledge',
      processedInput: result.inputProcessing?.processedInput || '',
      riddleQuality: result.riddleResponse?.metadata?.riddleQuality,
      actualSearchQuery: result.searchAnswer?.actualSearchQuery || '',
      answerStrategy: result.inputProcessing?.answerStrategy || 'unknown',
      answerStrategyReasoning:
        result.inputProcessing?.answerStrategy === 'singular'
          ? 'Singular answer strategy selected'
          : 'Multiple answer strategy selected',
      multipleRiddlesCount: result.riddleResponse?.riddles?.length || 0,
      searchRequested: result.webRequest?.searchRequested || false,
    },
  }),
}

const shouldSearch = (pl: {
  inputProcessing: { result: { needsSearch: boolean } }
}): boolean => pl.inputProcessing.result.needsSearch

// Stage 1: Input processing (detection, decipher, distillation) - Always runs
// Stage 2: Search & answer generation - Runs if search needed
// Stage 3: Riddle response generation - Always runs
const WorkflowV2 = pipeline()
  .step('inputProcessing', inputProcessingStage)
  .step('searchAnswer', searchAnswerStage, {
    when: shouldSearch,
    after: ['inputProcessing'],
  })
  .step('riddleResponse', riddleResponseStage, {
    after: ['inputProcessing', 'searchAnswer'],
  })
  .build()

export default WorkflowV2
export { workflowV2Adapters }
export type { WorkflowV2Input, WorkflowV2Output, V2RiddleResponse }
