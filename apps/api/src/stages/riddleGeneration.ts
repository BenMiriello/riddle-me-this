interface RiddleGenerationInput {
  plainTextAnswer: string
}

interface RiddleGenerationOutput {
  riddle: string
}

const riddleGeneration = ({
  plainTextAnswer,
}: RiddleGenerationInput): RiddleGenerationOutput => {
  // fill in LLM operation later for converting answer to riddle
  const riddle = `What speaks of "${plainTextAnswer}" but has no mouth?`

  return { riddle }
}

export default riddleGeneration
