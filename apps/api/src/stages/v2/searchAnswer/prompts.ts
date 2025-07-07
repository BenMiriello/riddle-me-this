interface PromptConfig {
  verbose: string
  concise: string
}

export const searchAnswerPrompts: PromptConfig = {
  verbose: `Using the provided search results, generate a comprehensive but concise answer to the question. Focus on the most relevant information from the search results.

GUIDELINES:
- Use specific information from the search results
- Be factual and accurate
- Keep answer concise (2-3 sentences max)
- Focus on the core answer, not peripheral details
- If search results don't directly answer the question, extract the most relevant information
- Avoid speculation or adding information not in the results

SEARCH RESULTS:
{searchContext}

QUESTION: {question}

Provide a direct, informative answer:`,

  concise: `Answer using search results. Be factual, concise (2-3 sentences).

Results: {searchContext}
Question: {question}

Answer:`,
}

export const knowledgeAnswerPrompts: PromptConfig = {
  verbose: `Provide a clear, concise answer based on general knowledge. Focus on the core concept and essential information.

GUIDELINES:
- Use general knowledge and common understanding
- Be accurate and factual
- Keep answer focused and brief (2-3 sentences)
- Avoid speculation or uncertain information
- If the topic requires current data that you don't have, acknowledge the limitation
- Focus on the most important aspects of the topic

TOPIC: {coreContent}
ORIGINAL QUESTION: {question}

Provide a direct, informative answer:`,

  concise: `Answer using general knowledge. Be accurate, brief (2-3 sentences).

Topic: {coreContent}
Question: {question}

Answer:`,
}
