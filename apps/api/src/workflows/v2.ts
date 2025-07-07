import { pipeline } from '../Pipeline'
import {
  inputProcessingStage,
  searchAnswerStage,
  riddleResponseStage,
} from '../stages/v2'

interface WorkflowV2Input {
  question: string
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
export type { WorkflowV2Input }
