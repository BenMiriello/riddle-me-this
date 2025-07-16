import type { SearchInput, SearchOptionalOutput } from '../../../workflows/v4'

export async function searchOptionalStage(
  input: SearchInput
): Promise<SearchOptionalOutput> {
  if (!input.needsSearch) {
    console.log('\n--- V4 STAGE 2: SearchOptional (SKIPPED) ---')
    return {
      searchPerformed: false
    }
  }
  
  console.log('\n--- V4 STAGE 2: SearchOptional ---')
  console.log('Performing search for:', input.question)
  
  // Use existing V2 search implementation
  const searchAnswerStage = (await import('../../../stages/v2/searchAnswer/searchAnswer')).default
  
  const searchResult = await searchAnswerStage({
    question: input.question,
    isRiddle: input.isRiddle,
    needsSearch: input.needsSearch,
    processedInput: input.question,
    userIntent: 'General information seeking',
    inputType: 'question',
    coreContent: input.question,
    answerStrategy: 'singular',
    env: input.env
  })
  
  const output = {
    searchPerformed: searchResult.searchPerformed,
    searchResults: searchResult.searchResults,
    answerContent: searchResult.answerContent,
    actualSearchQuery: searchResult.actualSearchQuery
  }
  
  console.log('Search completed - Found', output.searchResults?.length || 0, 'results')
  
  return output
}

export default searchOptionalStage
