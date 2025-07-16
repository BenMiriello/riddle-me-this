interface CloudflareEnv {
  AI_MODEL?: string
  AI_MODEL_CREATIVE?: string
  AI_MODEL_USES_THINKING?: boolean
}

const BASE_MODEL = '@cf/meta/llama-3.1-8b-instruct'
const CREATIVE_MODEL = '@cf/meta/llama-3.1-70b-instruct'

/**
 * Smart model selection based on task type
 * @param taskType - Type of task: 'classification' for fast decisions, 'creative' for riddle generation
 * @param env - Environment variables containing model overrides
 * @returns Model string for AI.run
 */
export function selectModel(taskType: 'classification' | 'creative', env?: CloudflareEnv): string {
  if (taskType === 'creative') {
    // Use powerful model for creative tasks like riddle generation
    return env?.AI_MODEL_CREATIVE || CREATIVE_MODEL
  }

  // Use fast model for classification, packaging, and simple tasks
  return env?.AI_MODEL || BASE_MODEL
}

/**
 * Get appropriate max_tokens value for task type
 * @param taskType - Type of task
 * @returns Recommended max_tokens value
 */
export function getMaxTokensForTask(taskType: 'classification' | 'creative'): number {
  return taskType === 'creative' ? 512 : 256
}

/**
 * Create AI options object with proper typing
 * @param taskType - Type of task
 * @param env - Environment variables
 * @returns AI options object with model and max_tokens
 */
export function createAIOptions(taskType: 'classification' | 'creative', env?: CloudflareEnv) {
  return {
    model: selectModel(taskType, env),
    max_tokens: getMaxTokensForTask(taskType),
  }
}