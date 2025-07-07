import { pipeline } from '../Pipeline'
import {
  detectionStage,
  decipherStage,
  searchStage,
  answerStage,
  riddleGenerationStage,
  createFinalResponse,
} from '../stages/primary'
import type { DetectionOutput } from '../stages/primary/riddleDetection'

// Workflow input type - defined where the workflow is defined
interface WorkflowInput {
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
  }
}

// Conditional helper functions
const shouldDecipher = (pl: {
  detection: { result: DetectionOutput }
}): boolean => pl.detection.result.inputWasRiddle

const shouldSearch = (pl: {
  detection: { result: DetectionOutput }
}): boolean => pl.detection.result.needsSearch

const shouldGenerateRiddle = (pl: {
  detection: { result: DetectionOutput }
}): boolean => !pl.detection.result.inputWasRiddle

// Create the workflow
const originalWorkflow = pipeline()
  .step('detection', detectionStage)
  .step('decipher', decipherStage, { when: shouldDecipher })
  .step('search', searchStage, {
    when: shouldSearch,
    after: ['detection', 'decipher'],
  })
  .step('answer', answerStage, {
    after: ['detection', 'decipher', 'search'],
  })
  .step('riddle', riddleGenerationStage, { when: shouldGenerateRiddle })
  .merge('final', createFinalResponse, {
    after: ['detection', 'decipher', 'search', 'answer', 'riddle'],
  })
  .build()

export default originalWorkflow
export type { WorkflowInput }
// Output type is inferred from createFinalResponse in ../stages/handleFinalMerge
export type { FinalOutput } from '../stages/primary/handleFinalMerge'
