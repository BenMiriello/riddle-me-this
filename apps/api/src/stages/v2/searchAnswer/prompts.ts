interface PromptConfig {
  verbose: string
  concise: string
}

export const searchAnswerPrompts: PromptConfig = {
  verbose: `Using the provided CURRENT, LIVE search results, generate a comprehensive but concise answer to the question. These are fresh, up-to-date results from the web, not historical knowledge.

IMPORTANT: You have access to current, real-time information. Do not mention "knowledge cutoff" or "as of my last update" - this is live, current data.

SELECTION STRATEGY: 
- Automatically prioritize the search result that most directly answers the question
- If multiple results are relevant, combine information from the most pertinent ones
- Ignore results that are off-topic or provide only tangential information

GUIDELINES:
- Use specific information from the most relevant search results
- Be factual and accurate  
- Keep answer concise (2-3 sentences max)
- Focus on the core answer, not peripheral details
- Prioritize results that directly address the user's question
- Avoid speculation or adding information not in the results
- Present information as current/live data, not historical

SEARCH RESULTS:
{searchContext}

QUESTION: {question}

Provide a direct, informative answer:`,

  concise: `Answer using these CURRENT, LIVE search results. Prioritize the most relevant results that directly answer the question. Be factual, concise (2-3 sentences). Do not mention "knowledge cutoff".

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
