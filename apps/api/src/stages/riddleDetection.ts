interface RiddleDetectionInput {
  userInput: string
}

interface RiddleDetectionOutput {
  userInput: string
  isRiddle: boolean
}

const riddleDetection = ({
  userInput,
}: RiddleDetectionInput): RiddleDetectionOutput => {
  // fill in LLM operation later
  const isRiddle = !!Math.floor(Math.random() * 2)

  return { userInput, isRiddle }
}

export default riddleDetection
