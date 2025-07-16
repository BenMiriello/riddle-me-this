import { getAI } from '../../../workflows/v4/globalEnv'
import { riddleGenerationPrompt } from './prompts'
import type { ResponseGenerationInput, ResponseGenerationOutput } from '../../../workflows/v4'

export async function riddleGenerationStage(
  input: ResponseGenerationInput
): Promise<ResponseGenerationOutput> {
  const ai = getAI()
  // Generate riddle about the search content (not extracted terms)
  const content = input.searchContent || input.content
  
  console.log('\n--- V4 STAGE 3: RiddleGeneration ---')
  console.log('Creating riddle about:', content.substring(0, 100) + (content.length > 100 ? '...' : ''))
  
  const prompt = riddleGenerationPrompt
    .replace('{content}', content)
  
  const creativeModel = input.env.AI_MODEL_CREATIVE || '@cf/meta/llama-3.1-70b-instruct'
  const baseModel = input.env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct'
  
  try {
    // Try  with creative model first
    const result = await ai.run(creativeModel, {
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Create a riddle about: ${content}` }
      ],
      max_tokens: 512
    })
    
    const output = {
      finalResponse: result.response,
      responseType: 'generated_riddle' as const,
      riddleTarget: content, // Target is the actual content, not extracted terms
      nextActionWord: 'finalizing response'
    }
    
    console.log('Generated riddle (length:', output.finalResponse.length, 'chars' + ')')
    console.log('Riddle preview:', output.finalResponse.substring(0, 80) + '...')
    
    return output
  } catch (error) {
    console.error('Creative model failed, trying fallback:', error)
    
    try {
      // Fallback to 8B model with same prompt
      const fallbackPrompt = riddleGenerationPrompt
        .replace('{content}', content)
      
      const fallbackResult = await ai.run(baseModel, {
        messages: [
          { role: 'system', content: fallbackPrompt },
          { role: 'user', content: `Create a riddle about: ${content}` }
        ],
        max_tokens: 256
      })

      return {
        finalResponse: fallbackResult.response,
        responseType: 'generated_riddle' as const,
        riddleTarget: content,
        nextActionWord: 'finalizing response'
      }
    } catch (fallbackError) {
      console.error('Both models failed:', fallbackError)
      
      return {
        finalResponse: 'I present a mystery that cannot be easily solved.',
        responseType: 'stumper_response' as const,
        riddleTarget: content,
        nextActionWord: 'finalizing response'
      }
    }
  }
}

export default riddleGenerationStage
