import type { ResponseAssemblyInput, ResponseAssemblyOutput } from '../../../workflows/v4'

export async function responseAssemblyStage(
  input: ResponseAssemblyInput
): Promise<ResponseAssemblyOutput> {
  console.log('\n--- V4 STAGE 4: ResponseAssembly ---')
  console.log('Packaging final response')

  // Build badges based on actions taken
  const badges = []
  
  if (input.classificationData.isRiddle) {
    badges.push({ type: 'riddle_asked', earned: true, context: 'User asked a riddle' })
  }
  
  if (input.searchData?.searchPerformed) {
    badges.push({ type: 'search_performed', earned: true, context: 'Web search executed' })
  }
  
  if (input.generatedContent.responseType === 'generated_riddle') {
    badges.push({ type: 'creative_generation', earned: true, context: 'New riddle generated' })
  }
  
  if (input.generatedContent.responseType === 'riddle_answer') {
    badges.push({ type: 'direct_answer', earned: true, context: 'Riddle answer provided' })
  }
  
  // Construct metadata
  const metadata = {
    originalInput: input.classificationData.coreContent,
    riddleTarget: input.generatedContent.riddleTarget,
  }

  // Generate completion message for search results
  const resultCount = input.searchData?.searchResults?.length || 0
  const completedAction = input.searchData?.searchPerformed 
    ? `found ${resultCount} result${resultCount === 1 ? '' : 's'}`
    : undefined
  
  const finalOutput = {
    finalResponse: input.generatedContent.finalResponse,
    responseType: input.generatedContent.responseType,
    badges,
    metadata,
    searchPerformed: input.searchData?.searchPerformed || false,
    searchResults: input.searchData?.searchResults || [],
    // Add riddles array for frontend compatibility
    riddles: input.generatedContent.responseType === 'generated_riddle' ? [{
      finalResponse: input.generatedContent.finalResponse,
      responseType: input.generatedContent.responseType,
      riddleTarget: input.generatedContent.riddleTarget,
      sourceResult: input.searchData?.searchResults?.[0] || null
    }] : null,
    actionWords: {
      presentTense: input.generatedContent.nextActionWord || 'completing'
    },
    ...(completedAction && { completedAction })
  }
  
  console.log('Assembly complete - ResponseType:', finalOutput.responseType)
  console.log('Badges earned:', finalOutput.badges.length, '| Search performed:', finalOutput.searchPerformed)
  
  return finalOutput
}

export default responseAssemblyStage
