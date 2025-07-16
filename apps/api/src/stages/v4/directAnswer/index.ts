import type { ResponseGenerationInput, ResponseGenerationOutput } from '../../../workflows/v4'

export async function directAnswerStage(
  input: ResponseGenerationInput
): Promise<ResponseGenerationOutput> {
  console.log('\n--- V4 STAGE 3: DirectAnswer ---')
  console.log('Providing answer for riddle')
  
  // If input was a riddle, provide the answer directly
  if (input.isRiddle && input.riddleAnswer) {
    const output = {
      finalResponse: input.riddleAnswer,
      responseType: 'riddle_answer' as const,
      riddleTarget: input.riddleAnswer,
      nextActionWord: 'finalizing response'
    }
    
    console.log('Direct answer provided:', output.finalResponse)
    
    return output
  }
  
  // Fallback if no riddle answer available
  return {
    finalResponse: 'I understand you asked a riddle, but I cannot provide the answer.',
    responseType: 'stumper_response' as const,
    nextActionWord: 'finalizing response'
  }
}

export default directAnswerStage