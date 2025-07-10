import { Hono } from 'hono'
import { cors } from 'hono/cors'
import originalWorkflow, {
  type WorkflowV1Input,
  type FinalOutput,
} from './workflows/v1'
import WorkflowV2, {
  workflowV2Adapters,
  type WorkflowV2Input,
  type WorkflowV2Output,
  type V2RiddleResponse,
} from './workflows/v2'

interface Env {
  AI: {
    run: (
      model: string,
      options: {
        messages: Array<{ role: string; content: string }>
      }
    ) => Promise<{ response: string }>
  }
  GOOGLE_SEARCH_API_KEY?: string
  GOOGLE_SEARCH_ENGINE_ID?: string
  AI_MODEL?: string
  RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  ENVIRONMENT?: string
  APP_VERSION?: string
  CF_PAGES_COMMIT_SHA?: string
  GITHUB_SHA?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('RiddleMeThis API')
})

app.get('/health', (c) => {
  try {
    const environment = c.env.ENVIRONMENT || 'production'
    const isProduction = environment === 'production'
    const gitSha = c.env.CF_PAGES_COMMIT_SHA || c.env.GITHUB_SHA || '7a3b054'

    let version = c.env.APP_VERSION || 'dev'
    if (!isProduction) {
      version = `dev@${gitSha.substring(0, 7)}`
    }

    return c.json({
      status: 'healthy',
      version: version,
      gitSha: gitSha.substring(0, 7),
      buildTime: new Date().toISOString(),
      environment: environment,
    })
  } catch (error) {
    return c.json({ error: 'Health check failed', details: String(error) }, 500)
  }
})

app.post('/v1/riddle', async (c) => {
  try {
    const { question } = await c.req.json()

    if (!question) {
      return c.json({ error: 'Question is required' }, 400)
    }

    const workflowInput: WorkflowV1Input = {
      question,
      env: {
        AI: c.env.AI,
        GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
        GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
        AI_MODEL: c.env.AI_MODEL,
      },
    }

    const workflowResult = await originalWorkflow.execute(workflowInput)

    // Extract final result from structured response
    const result = (workflowResult as { final: FinalOutput }).final

    return c.json(result)
  } catch (error) {
    console.error('Error:', error)
    return c.json({ error: 'Failed to process question' }, 500)
  }
})

app.post('/v2/riddle', async (c) => {
  try {
    const { question } = await c.req.json()

    if (!question) {
      return c.json({ error: 'Question is required' }, 400)
    }

    const workflowInput: WorkflowV2Input = {
      question,
      env: {
        AI: c.env.AI,
        GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
        GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
        AI_MODEL: c.env.AI_MODEL,
        RIDDLE_PROMPT_MODE: c.env.RIDDLE_PROMPT_MODE,
      },
    }

    const workflowResult = (await WorkflowV2.execute(
      workflowInput
    )) as WorkflowV2Output

    // Use adapter to transform to API format
    const apiResponse: V2RiddleResponse =
      workflowV2Adapters.toApiV2(workflowResult)

    return c.json(apiResponse)
  } catch (error) {
    console.error('Error:', error)
    return c.json({ error: 'Failed to process question' }, 500)
  }
})

export default app
