interface PlainTextResponseInput {
  plainTextAnswer: string
}

interface PlainTextResponseOutput {
  response: string
}

const plainTextResponse = ({
  plainTextAnswer,
}: PlainTextResponseInput): PlainTextResponseOutput => {
  // Just pass through the plain text answer as final response
  return { response: plainTextAnswer }
}

export default plainTextResponse
