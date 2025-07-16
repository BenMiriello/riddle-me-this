import { getAI } from '../../../workflows/v4/globalEnv'
import { inputClassificationPrompt } from './prompts'
import type { WorkflowV4Input, InputClassificationOutput } from '../../../workflows/v4'

export async function inputClassificationStage(
  input: WorkflowV4Input
): Promise<InputClassificationOutput> {
  const ai = getAI()
  // Use fast model for classification
  const model = input.env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct'
  
  const prompt = inputClassificationPrompt
    .replace('{question}', input.question)
  
  try {
    console.log('\n--- V4 STAGE 1: InputClassification ---')
    console.log('Processing question:', input.question)
    
    const result = await ai.run(model, {
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input.question }
      ],
      max_tokens: 256
    })
    
    // Parse JSON response
    const parsed = JSON.parse(result.response)
    
    const output = {
      inputType: parsed.inputType || 'question',
      isRiddle: parsed.isRiddle || false,
      needsSearch: parsed.needsSearch || false,
      riddleAnswer: parsed.riddleAnswer || undefined,
      searchQuery: parsed.searchQuery || undefined,
      coreContent: parsed.coreContent || input.question,
      userIntent: parsed.userIntent || 'General information seeking',
      badges: parsed.badges || [],
      nextActionWord: parsed.nextActionWord || 'processing',
      subsequentActionWord: parsed.subsequentActionWord || undefined
    }
    
    console.log('Output - IsRiddle:', output.isRiddle, '| NeedsSearch:', output.needsSearch)
    console.log('Next action word:', output.nextActionWord)
    
    return output
  } catch (error) {
    console.error('Input classification error:', error)
    
    // Fallback classification logic
    const isRiddle = input.question.includes('What am I') || 
                    input.question.includes('I am') || 
                    input.question.includes('What has') ||
                    input.question.includes('riddle')
    
    const needsSearch = input.question.includes('weather') || 
                       input.question.includes('current') || 
                       input.question.includes('latest') ||
                       input.question.includes('news') ||
                       input.question.includes('today')
    
    return {
      inputType: 'question',
      isRiddle,
      needsSearch,
      coreContent: input.question,
      userIntent: 'General information seeking',
      badges: [],
      nextActionWord: needsSearch ? 'investigating data sources' : 
                      (isRiddle ? 'providing solution' : 'crafting mysterious riddle'),
      subsequentActionWord: needsSearch ? 'weaving riddle patterns' : undefined
    }
  }
}

export default inputClassificationStage
