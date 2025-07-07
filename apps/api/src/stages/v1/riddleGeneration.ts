interface RiddleGenerationInput {
  answerResponse: string // From answer stage
  inputWasRiddle: boolean // From detection stage
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    AI_MODEL?: string
  }
}

interface RiddleGenerationOutput {
  riddleResponse: string
}

const riddleGenerationStage = async (
  input: RiddleGenerationInput
): Promise<RiddleGenerationOutput> => {
  let riddleResponse = ''

  if (!input.inputWasRiddle) {
    const howToWriteARiddle = `
    Write a SHORT riddle (2-4 lines maximum) that:
    1. MUST clearly hint at the specific answer provided
    2. Uses metaphor or imagery instead of direct terms
    3. Has a tone of mischief, intrigue, mystery, playfulness
    4. Is solvable - someone should be able to guess the specific answer
    5. Avoids being just poetry about the topic
    6. Hints at or uses in some rephrased or artfully obscured way an identifiable or defining characteristic of the real answer.

    The riddle must lead to the exact answer given, not just be related to the topic.
    Format: Present it as a riddle question, not a statement.
    Length: 2-4 lines only. Be concise!
    `

    const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
    const riddleResult = await input.env.AI.run(model, {
      messages: [
        {
          role: 'system',
          content: `Transform this answer into a short riddle. Requirements:
${howToWriteARiddle}
Return ONLY the riddle, nothing else. Maximum 4 lines.`,
        },
        { role: 'user', content: input.answerResponse },
      ],
    })
    riddleResponse = riddleResult.response
  }

  return {
    riddleResponse,
  }
}

export default riddleGenerationStage
export type { RiddleGenerationInput, RiddleGenerationOutput }
