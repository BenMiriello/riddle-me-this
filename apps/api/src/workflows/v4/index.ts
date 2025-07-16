import { pipeline, Workflow } from '../../Pipeline'
import { initializeGlobalEnv } from './globalEnv'
import { inputClassificationStage } from '../../stages/v4/inputClassification'
import { searchOptionalStage } from '../../stages/v4/searchOptional'
import { riddleGenerationStage } from '../../stages/v4/riddleGeneration'
import { directAnswerStage } from '../../stages/v4/directAnswer'
import { responseAssemblyStage } from '../../stages/v4/responseAssembly'

export interface WorkflowV4Input {
  question: string
  searchRequested?: boolean
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }>; max_tokens?: number }
      ) => Promise<{ response: string }>
    }
    GOOGLE_SEARCH_API_KEY?: string
    GOOGLE_SEARCH_ENGINE_ID?: string
    AI_MODEL?: string
    AI_MODEL_CREATIVE?: string
    AI_MODEL_USES_THINKING?: boolean
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

// Stage output interfaces (simplified from V3)
export interface InputClassificationOutput {
  inputType: 'question' | 'url' | 'procedural' | 'numerical' | 'comparative' | 'descriptive' | 'transactional'
  isRiddle: boolean
  needsSearch: boolean
  riddleAnswer?: string
  searchQuery?: string
  coreContent: string
  userIntent: string
  badges: string[]
  nextActionWord: string
  subsequentActionWord?: string
}

// Merged input interfaces for V2-style stage functions
export interface SearchInput extends WorkflowV4Input {
  searchQuery?: string
  needsSearch: boolean
  isRiddle: boolean
}

export interface ResponseGenerationInput extends WorkflowV4Input {
  content: string
  isRiddle: boolean
  riddleAnswer?: string
  searchContent?: string
}

export interface ResponseAssemblyInput extends WorkflowV4Input {
  generatedContent: ResponseGenerationOutput
  classificationData: InputClassificationOutput
  searchData?: SearchOptionalOutput
}

export interface SearchOptionalOutput {
  searchPerformed: boolean
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  answerContent?: string
  actualSearchQuery?: string
}

export interface ResponseGenerationOutput {
  finalResponse: string
  responseType: 'riddle_answer' | 'generated_riddle' | 'stumper_response'
  riddleTarget?: string
  nextActionWord: string
}

export interface ResponseAssemblyOutput {
  finalResponse: string
  responseType: 'riddle_answer' | 'generated_riddle' | 'stumper_response'
  badges: Array<{ type: string; earned: boolean; context?: string }>
  metadata: {
    originalInput: string
    riddleTarget?: string
  }
  searchResults?: Array<{ title: string; snippet: string; link: string }>
  searchPerformed: boolean
  // Add riddles array for frontend compatibility
  riddles?: Array<{
    finalResponse: string
    responseType: string
    riddleTarget?: string
    sourceResult?: { title: string; snippet: string; link: string } | null
  }> | null
  actionWords: {
    presentTense: string
  }
  completedAction?: string
}

async function responseGenerationStage(input: ResponseGenerationInput): Promise<ResponseGenerationOutput> {
  if (input.isRiddle && input.riddleAnswer) {
    return await directAnswerStage(input)
  }
  
  return await riddleGenerationStage(input)
}

const WorkflowV4 = pipeline()
  .step('inputClassification', (input: WorkflowV4Input) => {
    initializeGlobalEnv(input.env)
    return inputClassificationStage(input)
  })
  .yield('input-complete', (data: any) => {
    const { needsSearch, nextActionWord } = data.inputClassification
    const nextStep = needsSearch ? 'search' : 'response-generation'
    
    return {
      nextStep,
      actionWord: nextActionWord,
    }
  })
  
  .step('search', 
    searchOptionalStage,
    {
      when: (pl: any) => pl.inputClassification.result.needsSearch,
      after: ['inputClassification'],
      merge: (pl: any) => ({
        searchQuery: pl.inputClassification.result.searchQuery,
        needsSearch: pl.inputClassification.result.needsSearch,
        isRiddle: pl.inputClassification.result.isRiddle
      })
    }
  )
  .yield('search-complete', 
    (data: any) => ({
      nextStep: 'response-generation',
      actionWord: data.inputClassification.subsequentActionWord || 'crafting response',
    })
  )
  
  .step('responseGeneration', responseGenerationStage, {
    after: ['inputClassification', 'search'],
    merge: (pl: any) => ({
      content: pl.inputClassification.result.coreContent,
      isRiddle: pl.inputClassification.result.isRiddle,
      riddleAnswer: pl.inputClassification.result.riddleAnswer,
      searchContent: pl.search?.result.answerContent
    })
  })
  .yield('generation-complete', (data: any) => ({
    nextStep: 'response-assembly',
    actionWord: data.responseGeneration.nextActionWord,
  }))
  
  .step('responseAssembly', responseAssemblyStage, {
    after: ['responseGeneration'],
    merge: (pl: any) => ({
      generatedContent: pl.responseGeneration.result,
      classificationData: pl.inputClassification.result,
      searchData: pl.search?.result
    })
  })
  .build()

const WorkflowV4WithExecute = {
  ...WorkflowV4,
  async execute(input: WorkflowV4Input) {
    return await (WorkflowV4 as Workflow).execute(input)
  },
}

export const executeV4Workflow = (input: WorkflowV4Input) => 
  WorkflowV4WithExecute.execute(input)

export const startV4Session = (input: WorkflowV4Input, sessionId: string) =>
  WorkflowV4.start(input, sessionId)

export default WorkflowV4WithExecute
