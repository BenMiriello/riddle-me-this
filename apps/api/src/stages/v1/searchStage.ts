interface SearchInput {
  searchQuery: string
  env: {
    GOOGLE_SEARCH_API_KEY?: string
    GOOGLE_SEARCH_ENGINE_ID?: string
  }
  needsSearch: boolean
}

interface SearchOutput {
  searchResults: Array<{ title: string; snippet: string; link: string }>
  searchPerformed: boolean
}

const searchStage = async (input: SearchInput): Promise<SearchOutput> => {
  let searchResults: Array<{ title: string; snippet: string; link: string }> =
    []
  let searchPerformed = false

  if (input.needsSearch && input.env.GOOGLE_SEARCH_API_KEY) {
    try {
      const encodedSearchQuery = encodeURIComponent(input.searchQuery)
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${input.env.GOOGLE_SEARCH_API_KEY}&cx=${input.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodedSearchQuery}&num=3`

      const searchResponse = await fetch(searchUrl)
      const searchData = (await searchResponse.json()) as {
        items?: Array<{ title: string; snippet: string; link: string }>
      }

      searchResults =
        searchData.items
          ?.slice(0, 3)
          .map((item: { title: string; snippet: string; link: string }) => ({
            title: item.title,
            snippet: item.snippet,
            link: item.link,
          })) || []

      searchPerformed = true
    } catch (searchError) {
      console.log('Search error:', searchError)
      searchResults = []
      searchPerformed = false
    }
  }

  return {
    searchResults,
    searchPerformed,
  }
}

export default searchStage
export type { SearchInput, SearchOutput }
