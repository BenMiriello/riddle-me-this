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
import WorkflowV3, { type WorkflowV3Input } from './workflows/v3'
import { executeV4Workflow, type WorkflowV4Input } from './workflows/v4'

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
  AI_MODEL_CREATIVE?: string
  AI_MODEL_USES_THINKING?: boolean
  RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  ENVIRONMENT?: string
  APP_VERSION?: string
  CF_PAGES_COMMIT_SHA?: string
  GITHUB_SHA?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'https://riddlemethis.io',
        'https://www.riddlemethis.io',
      ]

      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return true

      return allowedOrigins.includes(origin)
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

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
      models: { v3_default: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b' },
    })
  } catch (error) {
    return c.json({ error: 'Health check failed', details: String(error) }, 500)
  }
})

// Unified riddle endpoint - supports all workflow versions
app.post('/riddle', async (c) => {
  try {
    const { question, workflow = 'v3' } = await c.req.json()

    if (!question) {
      return c.json({ error: 'Question is required' }, 400)
    }

    const env = {
      AI: c.env.AI,
      GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
      GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
      AI_MODEL: c.env.AI_MODEL,
      RIDDLE_PROMPT_MODE: c.env.RIDDLE_PROMPT_MODE,
    }

    switch (workflow) {
      case 'v1': {
        const workflowInput: WorkflowV1Input = { question, env }
        const workflowResult = await originalWorkflow.execute(workflowInput)
        const result = (workflowResult as { final: FinalOutput }).final
        return c.json(result)
      }

      case 'v2': {
        const workflowInput: WorkflowV2Input = { question, env }
        const workflowResult = (await WorkflowV2.execute(
          workflowInput
        )) as WorkflowV2Output
        const apiResponse: V2RiddleResponse =
          workflowV2Adapters.toApiV2(workflowResult)
        return c.json(apiResponse)
      }

      case 'v3': {
        const workflowInput: WorkflowV3Input = { question, env }
        const result = await WorkflowV3.execute(workflowInput)
        return c.json(result)
      }

      case 'v4': {
        const startTime = Date.now()
        console.log('\n=== V4 REQUEST START ===')
        console.log('Question:', question)
        console.log('Timestamp:', new Date().toISOString())

        const workflowInput: WorkflowV4Input = { question, env }
        const result = await executeV4Workflow(workflowInput)
        const finalResponse = result.responseAssembly || result

        const processingTime = Date.now() - startTime
        console.log('\n=== V4 RESPONSE COMPLETE ===')
        console.log('Processing time:', processingTime + 'ms')
        console.log('Response type:', finalResponse.responseType)
        console.log('Search performed:', finalResponse.searchPerformed)
        console.log(
          'Final response preview:',
          finalResponse.finalResponse.substring(0, 100) + '...'
        )
        console.log('=== V4 REQUEST END ===\n')

        return c.json(finalResponse)
      }

      default:
        return c.json(
          { error: 'Invalid workflow version. Use v1, v2, v3, or v4' },
          400
        )
    }
  } catch (error) {
    console.error('Workflow error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// app.post('/v1/riddle', async (c) => {
//   try {
//     const { question } = await c.req.json()

//     if (!question) {
//       return c.json({ error: 'Question is required' }, 400)
//     }

//     const workflowInput: WorkflowV1Input = {
//       question,
//       env: {
//         AI: c.env.AI,
//         GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
//         GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
//         AI_MODEL: c.env.AI_MODEL,
//       },
//     }

//     const workflowResult = await originalWorkflow.execute(workflowInput)

//     // Extract final result from structured response
//     const result = (workflowResult as { final: FinalOutput }).final

//     return c.json(result)
//   } catch (error) {
//     console.error('Error:', error)
//     return c.json({ error: 'Failed to process question' }, 500)
//   }
// })

// app.post('/v2/riddle', async (c) => {
//   try {
//     const { question } = await c.req.json()

//     if (!question) {
//       return c.json({ error: 'Question is required' }, 400)
//     }

//     const workflowInput: WorkflowV2Input = {
//       question,
//       env: {
//         AI: c.env.AI,
//         GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
//         GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
//         AI_MODEL: c.env.AI_MODEL,
//         RIDDLE_PROMPT_MODE: c.env.RIDDLE_PROMPT_MODE,
//       },
//     }

//     const workflowResult = (await WorkflowV2.execute(
//       workflowInput
//     )) as WorkflowV2Output

//     // Use adapter to transform to API format
//     const apiResponse: V2RiddleResponse =
//       workflowV2Adapters.toApiV2(workflowResult)

//     return c.json(apiResponse)
//   } catch (error) {
//     console.error('Error:', error)
//     return c.json({ error: 'Failed to process question' }, 500)
//   }
// })

// // Legacy V3 endpoint (kept for backward compatibility)
// app.post('/v3/riddle', async (c) => {
//   try {
//     const { question } = await c.req.json()

//     if (!question) {
//       return c.json({ error: 'Question is required' }, 400)
//     }

//     const workflowInput: WorkflowV3Input = {
//       question,
//       env: {
//         AI: c.env.AI,
//         GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
//         GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
//         AI_MODEL: c.env.AI_MODEL,
//         RIDDLE_PROMPT_MODE: c.env.RIDDLE_PROMPT_MODE,
//       },
//     }

//     const result = await WorkflowV3.execute(workflowInput)

//     return c.json(result)
//   } catch (error) {
//     console.error('V3 Error:', error)
//     return c.json({ error: 'Failed to process question' }, 500)
//   }
// })

// // V4 endpoint - Smart model routing with simplified stages
// app.post('/v4/riddle', async (c) => {
//   const startTime = Date.now()

//   try {
//     const { question } = await c.req.json()

//     if (!question) {
//       return c.json({ error: 'Question is required' }, 400)
//     }

//     console.log('\n=== V4 REQUEST START ===')
//     console.log('Question:', question)
//     console.log('Timestamp:', new Date().toISOString())

//     const workflowInput: WorkflowV4Input = {
//       question,
//       env: {
//         AI: c.env.AI,
//         GOOGLE_SEARCH_API_KEY: c.env.GOOGLE_SEARCH_API_KEY,
//         GOOGLE_SEARCH_ENGINE_ID: c.env.GOOGLE_SEARCH_ENGINE_ID,
//         AI_MODEL: c.env.AI_MODEL,
//         AI_MODEL_CREATIVE: c.env.AI_MODEL_CREATIVE,
//         AI_MODEL_USES_THINKING: c.env.AI_MODEL_USES_THINKING,
//         RIDDLE_PROMPT_MODE: c.env.RIDDLE_PROMPT_MODE,
//       },
//     }

//     const result = await executeV4Workflow(workflowInput)

//     // Extract the final response from the pipeline result
//     const finalResponse = result.responseAssembly || result

//     return c.json(finalResponse)
//   } catch (error) {
//     const processingTime = Date.now() - startTime
//     console.error('V4 Error:', { error: String(error), processingTime, question: c.req.json() })
//     return c.json({ error: 'Failed to process question' }, 500)
//   }
// })

export default app
