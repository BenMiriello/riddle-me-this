interface KnowledgeAnswerInput {
  plainTextQuestion: string
}

interface KnowledgeAnswerOutput {
  plainTextAnswer: string
  source: 'knowledge'
}

const knowledgeStage = ({
  plainTextQuestion,
}: KnowledgeAnswerInput): KnowledgeAnswerOutput => {
  // fill in LLM operation later for knowledge-based answering
  const plainTextAnswer = `Knowledge-based answer for: ${plainTextQuestion}`

  return {
    plainTextAnswer,
    source: 'knowledge',
  }
}

export default knowledgeStage
