interface SearchDetectionInput {
  plainTextQuestion: string
}

interface SearchDetectionOutput {
  plainTextQuestion: string
  needsSearch: boolean
}

const searchDetection = ({
  plainTextQuestion,
}: SearchDetectionInput): SearchDetectionOutput => {
  // fill in LLM operation later
  const needsSearch = !!Math.floor(Math.random() * 2)

  return { plainTextQuestion, needsSearch }
}

export default searchDetection
export type { SearchDetectionInput, SearchDetectionOutput }
