interface CloudflareEnv {
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

/**
 * Global access to environment variables and AI interface for all V4 stages
 */
let globalEnv: CloudflareEnv | null = null

/**
 * Initialize global environment access for all V4 stages
 * Must be called at the beginning of workflow execution
 */
export function initializeGlobalEnv(env: CloudflareEnv): void {
  globalEnv = env
}

/**
 * Get global environment instance
 * Throws error if not initialized
 */
export function getGlobalEnv(): CloudflareEnv {
  if (!globalEnv) {
    throw new Error('Global environment not initialized. Call initializeGlobalEnv() first.')
  }
  return globalEnv
}

/**
 * Get AI interface with global access
 */
export function getAI() {
  return getGlobalEnv().AI
}

/**
 * Get search API keys
 */
export function getSearchConfig() {
  const env = getGlobalEnv()
  return {
    apiKey: env.GOOGLE_SEARCH_API_KEY,
    engineId: env.GOOGLE_SEARCH_ENGINE_ID
  }
}

/**
 * Get model configuration
 */
export function getModelConfig() {
  const env = getGlobalEnv()
  return {
    defaultModel: env.AI_MODEL,
    creativeModel: env.AI_MODEL_CREATIVE,
    usesThinking: env.AI_MODEL_USES_THINKING,
    promptMode: env.RIDDLE_PROMPT_MODE || 'concise'
  }
}
