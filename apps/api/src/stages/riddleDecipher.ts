interface RiddleDecipherInput {
  userInput: string
}

interface RiddleDecipherOutput {
  decipheredInput: string
}

const riddleDecipher = ({
  userInput,
}: RiddleDecipherInput): RiddleDecipherOutput => {
  // fill in LLM operation later - decipher the riddle to plain text
  const decipheredInput = `plain text version of: ${userInput}`
  return { decipheredInput }
}

export default riddleDecipher
