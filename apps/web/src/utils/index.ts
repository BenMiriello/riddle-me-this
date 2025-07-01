interface SearchResult {
  title: string
  snippet: string
  link: string
}

interface ApiResponse {
  answer: string
  riddle: string
  response: string
  inputWasRiddle: boolean
  needsSearch: boolean
  searchPerformed: boolean
  searchQuery: string | null
  searchResults: SearchResult[]
  primarySource: SearchResult | null
  evaluation: string
}

export const printResponse = (data: ApiResponse) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('=== API RESPONSE ===')
    console.log('Full response:', data)
    console.log('Answer:', data.answer)
    console.log('Riddle:', data.riddle)
    console.log('Response:', data.response)
    console.log('Input was riddle:', data.inputWasRiddle)
    console.log('Needs search:', data.needsSearch)
    console.log('Search performed:', data.searchPerformed)
    console.log('Search query:', data.searchQuery)
    console.log('Search results:', data.searchResults)
    console.log('Search results length:', data.searchResults?.length)
    console.log('Primary source:', data.primarySource)
    console.log('Evaluation:', data.evaluation)
    console.log('=== END RESPONSE ===')
  }
}
