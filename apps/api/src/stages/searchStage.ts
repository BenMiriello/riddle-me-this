interface SearchStageInput {
  plainTextQuestion: string
}

interface SearchStageOutput {
  searchResults: Array<{ title: string; snippet: string; link: string }>
  primarySource: { title: string; snippet: string; link: string }
}

const searchStage = ({
  plainTextQuestion,
}: SearchStageInput): SearchStageOutput => {
  // fill in Google Custom Search API operation later

  // Expected format from Google Custom Search API:
  // {
  //   items?: Array<{ title: string; snippet: string; link: string }>
  // }

  const mockResults = [
    {
      title: `Search result for: ${plainTextQuestion}`,
      snippet: `Mock search snippet about ${plainTextQuestion}...`,
      link: 'https://example.com/1',
    },
    {
      title: `Related info: ${plainTextQuestion}`,
      snippet: `Additional context for ${plainTextQuestion}...`,
      link: 'https://example.com/2',
    },
  ]

  return {
    searchResults: mockResults,
    primarySource: mockResults[0],
  }
}

export default searchStage
