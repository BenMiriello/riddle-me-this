interface InputProcessingInput {
  question: string
  searchRequested?: boolean
  workflowVersion?: 'v2' | 'v3'
  env: {
    AI: {
      run: (
        model: string,
        options: { messages: Array<{ role: string; content: string }> }
      ) => Promise<{ response: string }>
    }
    GOOGLE_SEARCH_API_KEY?: string
    GOOGLE_SEARCH_ENGINE_ID?: string
    AI_MODEL?: string
    AI_MODEL_USES_THINKING?: boolean
    RIDDLE_PROMPT_MODE?: 'verbose' | 'concise'
  }
}

interface InputProcessingOutput {
  isRiddle: boolean
  needsSearch: boolean
  processedInput: string
  riddleAnswer?: string
  searchableAnswer?: string
  userIntent: string
  inputType:
    | 'question'
    | 'url'
    | 'procedural'
    | 'numerical'
    | 'comparative'
    | 'descriptive'
    | 'transactional'
  coreContent: string
  badges: Array<{
    type: string
    earned: boolean
    context?: string
  }>
  actionWords?: {
    presentTense: string
    pastTense: string
  }
  answerStrategy: 'singular' | 'multiple'
}

import { inputProcessingPrompts } from './prompts'

const inputProcessingStage = async (
  input: InputProcessingInput
): Promise<InputProcessingOutput> => {
  const model = input.env.AI_MODEL || '@cf/meta/llama-3-8b-instruct'
  const promptMode = input.env.RIDDLE_PROMPT_MODE || 'concise'

  // Initialize output with defaults
  let isRiddle = false
  let needsSearch = false
  const processedInput = input.question
  let riddleAnswer: string | undefined
  let searchableAnswer: string | undefined
  let userIntent = 'General information seeking'
  let inputType:
    | 'question'
    | 'url'
    | 'procedural'
    | 'numerical'
    | 'comparative'
    | 'descriptive'
    | 'transactional' = 'question'
  let coreContent = input.question
  const badges: Array<{ type: string; earned: boolean; context?: string }> = []
  let answerStrategy: 'singular' | 'multiple' = 'multiple'
  let actionWords: { presentTense: string; pastTense: string } | undefined

  // Single comprehensive LLM call that handles everything
  const prompts = inputProcessingPrompts(input.workflowVersion || 'v2')
  const inputPrompt = prompts[promptMode]

  try {
    const response = await input.env.AI.run(model, {
      messages: [
        { role: 'system', content: inputPrompt },
        { role: 'user', content: input.question },
      ],
      max_tokens: 512,
    } as any)

    let responseText = response.response.trim()

    // Enhanced cleaning for DeepSeek thinking tags based on research findings
    console.log(
      '🔧 AI_MODEL_USES_THINKING:',
      input.env.AI_MODEL_USES_THINKING,
      'Model:',
      input.env.AI_MODEL
    )
    console.log(
      '🔧 Raw response length:',
      responseText.length,
      'starts with:',
      responseText.substring(0, 50)
    )
    console.log(
      '🔧 Response ends with:',
      responseText.substring(responseText.length - 50)
    )
    console.log('🔧 Contains </think>:', responseText.includes('</think>'))
    console.log(
      '🔧 Think tag count - open:',
      (responseText.match(/<think>/g) || []).length,
      'close:',
      (responseText.match(/<\/think>/g) || []).length
    )

    let jsonContent = null

    // Method 1: Handle nested <think> tags by finding the last closing tag
    const lastThinkClose = responseText.lastIndexOf('</think>')
    if (lastThinkClose !== -1) {
      // Extract everything after the last </think> tag
      const afterThinkTags = responseText.substring(lastThinkClose + 8).trim()
      console.log(
        '🔧 Content after last </think>:',
        afterThinkTags.substring(0, 100)
      )

      if (afterThinkTags) {
        // Remove markdown code blocks first
        const cleanAfterThink = afterThinkTags
          .replace(/```json\s*/gi, '')
          .replace(/```\s*$/gm, '')
          .trim()

        console.log(
          '🔧 After removing markdown:',
          cleanAfterThink.substring(0, 100)
        )

        // Look for JSON in cleaned content
        const jsonMatch = cleanAfterThink.match(/\{[\s\S]*?\}/s)
        if (jsonMatch) {
          jsonContent = jsonMatch[0]
          console.log(
            '🔧 Method 1 - Found JSON after think tags (markdown cleaned)'
          )
        }
      }
    }

    // Method 2: If no JSON after tags, look inside the last think block
    if (!jsonContent) {
      // Find all think blocks including nested ones
      const allThinkMatches = [
        ...responseText.matchAll(/<think>([\s\S]*?)(?=<\/think>|$)/gi),
      ]

      if (allThinkMatches.length > 0) {
        // Check the last (outermost) think block for JSON
        const lastThinkContent = allThinkMatches[allThinkMatches.length - 1][1]
        console.log('🔧 Last think content length:', lastThinkContent.length)

        const jsonMatch = lastThinkContent.match(/\{[\s\S]*?\}/s)
        if (jsonMatch) {
          jsonContent = jsonMatch[0]
          console.log('🔧 Method 2 - Found JSON inside think tags')
        }
      }
    }

    // Method 3: Remove all thinking tags and extract JSON
    if (!jsonContent) {
      console.log('🔧 Method 3 - Fallback to removing all think tags')

      let cleanText = responseText
      // Remove all think tags (handles nested)
      cleanText = cleanText.replace(/<\/?think[^>]*>/gi, '').trim()

      // Remove markdown code blocks
      cleanText = cleanText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/gm, '')
        .trim()
      cleanText = cleanText.replace(/^```.*$/gm, '').trim()

      // Remove trailing newlines and whitespace (Cloudflare Workers AI issue)
      cleanText = cleanText.replace(/\n+$/, '').trim()

      // Extract first complete JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*?\}/s)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
        console.log('🔧 Method 3 - Found JSON after cleaning')
      }
    }

    // Method 4: Handle unclosed think tags - look for JSON patterns anywhere
    if (!jsonContent) {
      console.log(
        '🔧 Method 4 - Looking for JSON patterns anywhere in response (unclosed think tags)'
      )

      // Look for JSON wrapped in markdown first
      const markdownJsonMatch = responseText.match(
        /```json\s*(\{[\s\S]*?\})\s*```/s
      )
      if (markdownJsonMatch) {
        jsonContent = markdownJsonMatch[1]
        console.log('🔧 Method 4 - Found markdown-wrapped JSON')
      } else {
        // Look for any JSON object pattern
        const anyJsonMatch = responseText.match(
          /\{[\s\S]*?"inputType"[\s\S]*?\}/s
        )
        if (anyJsonMatch) {
          jsonContent = anyJsonMatch[0]
          console.log('🔧 Method 4 - Found JSON pattern with inputType')
        }
      }
    }

    // Method 5: Handle unclosed think tags with partial JSON at end
    if (!jsonContent) {
      const openThinkCount = (responseText.match(/<think>/g) || []).length
      const closeThinkCount = (responseText.match(/<\/think>/g) || []).length

      if (openThinkCount > closeThinkCount) {
        console.log(
          '🔧 Method 5 - Handling unclosed think tags, extracting content after <think>'
        )

        // Find the last <think> tag and extract everything after it
        const lastThinkIndex = responseText.lastIndexOf('<think>')
        if (lastThinkIndex !== -1) {
          const afterThink = responseText.substring(lastThinkIndex + 7).trim()
          console.log(
            '🔧 Content after last <think>:',
            afterThink.substring(0, 200)
          )

          // Try to find any structured content that looks like JSON fields
          // Look for patterns like: "inputType": "question", "isRiddle": false, etc.
          const fieldPattern = /"?\w+"?\s*:\s*(?:"[^"]*"|true|false|\d+)/g
          const fields = afterThink.match(fieldPattern)

          if (fields && fields.length >= 3) {
            // Try to construct valid JSON from field patterns
            const jsonStr = '{' + fields.join(', ') + '}'
            console.log(
              '🔧 Constructed JSON from fields:',
              jsonStr.substring(0, 200)
            )

            try {
              JSON.parse(jsonStr) // Test if it's valid
              jsonContent = jsonStr
              console.log(
                '🔧 Method 5 - Successfully constructed JSON from field patterns'
              )
            } catch {
              console.log(
                '🔧 Method 5 - Constructed JSON is invalid, trying direct extraction'
              )

              // Fallback: look for any JSON-like structure in the remaining content
              const jsonMatch = afterThink.match(/\{[\s\S]*?\}/s)
              if (jsonMatch) {
                jsonContent = jsonMatch[0]
                console.log('🔧 Method 5 - Found JSON pattern after <think>')
              }
            }
          }
        }
      }
    }

    responseText = jsonContent || responseText
    console.log(
      '🔧 Final JSON length:',
      responseText.length,
      'starts with:',
      responseText.substring(0, 50)
    )

    const result = JSON.parse(responseText)

    // Extract basic classification
    inputType = result.inputType || 'question'
    isRiddle = result.isRiddle || false

    // Handle needsSearch: user requested OR system determined
    const systemDeterminedSearch = result.needsSearch || false
    needsSearch = input.searchRequested || systemDeterminedSearch

    // Ensure coreContent is never null or empty
    coreContent =
      result.coreContent && result.coreContent !== 'null'
        ? result.coreContent
        : input.question

    // Handle riddle answer extraction from simplified structure
    if (result.riddleAnswer) {
      isRiddle = true
      riddleAnswer = result.riddleAnswer
      searchableAnswer = result.searchableAnswer

      // Add riddle_solver badge for successful riddle solving
      badges.push({
        type: 'riddle_solver',
        earned: true,
        context: 'riddle_solved',
      })

      // Fallback for missing searchableAnswer on weather queries
      if (
        !searchableAnswer &&
        needsSearch &&
        input.question.toLowerCase().includes('weather')
      ) {
        const locationMatch = input.question.match(
          /in\s+([^?]+?)(?:\s+today|\s+now|$|\?)/i
        )
        if (locationMatch) {
          const location = locationMatch[1].trim()
          searchableAnswer = `weather in ${location}`
        }
      }

      // Use riddle answer as core content if solved
      if (riddleAnswer) {
        coreContent = riddleAnswer
      }
    }

    // Extract user intent
    if (result.userIntent) {
      userIntent = result.userIntent
    }

    // Generate actionWords for V3 (since removed from main prompt to avoid truncation)
    if (input.workflowVersion === 'v3') {
      // Use context-appropriate action words based on input type and content
      let presentTense = 'analyzing'
      let pastTense = 'analyzed'

      if (isRiddle) {
        presentTense = 'deciphering'
        pastTense = 'deciphered'
      } else if (needsSearch) {
        presentTense = 'investigating'
        pastTense = 'investigated'
      } else if (inputType === 'url') {
        presentTense = 'exploring'
        pastTense = 'explored'
      } else if (inputType === 'procedural') {
        presentTense = 'processing'
        pastTense = 'processed'
      }

      actionWords = { presentTense, pastTense }
    }

    // Handle URL processing
    if (inputType === 'url') {
      needsSearch = true // Always search for URL content
    }

    // Add all badges detected by comprehensive analysis
    if (result.badges && Array.isArray(result.badges)) {
      result.badges.forEach((badgeType: string) => {
        badges.push({
          type: badgeType,
          earned: true,
          context: 'comprehensive_analysis',
        })
      })
    }

    // Extract answer strategy
    if (result.answerStrategy) {
      answerStrategy = result.answerStrategy
      console.log(
        'Strategy extracted from comprehensive prompt:',
        answerStrategy
      )
    } else {
      console.log(
        'No answerStrategy found in result, using default:',
        answerStrategy
      )
    }
  } catch (error) {
    console.log('Comprehensive processing error:', error)

    // Fallback to simpler analysis
    try {
      const fallbackResponse = await input.env.AI.run(model, {
        messages: [
          {
            role: 'system',
            content:
              'JSON-only system. Choose exactly ONE value: inputType must be "question" (for simple text), "url", "procedural", "numerical", "comparative", "descriptive", or "transactional". answerStrategy must be "singular" or "multiple". Format: {"inputType": "question", "isRiddle": false, "needsSearch": false, "coreContent": "use the actual input text", "userIntent": "what user wants to accomplish", "answerStrategy": "multiple", "badges": []}',
          },
          { role: 'user', content: input.question },
        ],
      })

      // Enhanced fallback cleaning (same logic as main processing)
      let fallbackText = fallbackResponse.response.trim()
      console.log(
        '🔧 Fallback raw length:',
        fallbackText.length,
        'starts with:',
        fallbackText.substring(0, 50)
      )

      let fallbackJsonContent = null

      // Method 1: Handle nested <think> tags by finding the last closing tag
      const lastThinkClose = fallbackText.lastIndexOf('</think>')
      if (lastThinkClose !== -1) {
        const afterThinkTags = fallbackText.substring(lastThinkClose + 8).trim()
        console.log(
          '🔧 Fallback content after last </think>:',
          afterThinkTags.substring(0, 100)
        )

        if (afterThinkTags) {
          // Remove markdown code blocks first
          const cleanAfterThink = afterThinkTags
            .replace(/```json\s*/gi, '')
            .replace(/```\s*$/gm, '')
            .trim()

          console.log(
            '🔧 Fallback after removing markdown:',
            cleanAfterThink.substring(0, 100)
          )

          // Look for JSON in cleaned content
          const jsonMatch = cleanAfterThink.match(/\{[\s\S]*?\}/s)
          if (jsonMatch) {
            fallbackJsonContent = jsonMatch[0]
            console.log(
              '🔧 Fallback Method 1 - Found JSON after think tags (markdown cleaned)'
            )
          }
        }
      }

      // Method 2: If no JSON after tags, look inside the last think block
      if (!fallbackJsonContent) {
        const allThinkMatches = [
          ...fallbackText.matchAll(/<think>([\s\S]*?)(?=<\/think>|$)/gi),
        ]

        if (allThinkMatches.length > 0) {
          const lastThinkContent =
            allThinkMatches[allThinkMatches.length - 1][1]
          console.log(
            '🔧 Fallback last think content length:',
            lastThinkContent.length
          )

          const jsonMatch = lastThinkContent.match(/\{[\s\S]*?\}/s)
          if (jsonMatch) {
            fallbackJsonContent = jsonMatch[0]
            console.log('🔧 Fallback Method 2 - Found JSON inside think tags')
          }
        }
      }

      // Method 3: Remove all thinking tags and extract JSON
      if (!fallbackJsonContent) {
        console.log('🔧 Fallback Method 3 - Removing all think tags')

        let cleanText = fallbackText
        cleanText = cleanText.replace(/<\/?think[^>]*>/gi, '').trim()
        cleanText = cleanText
          .replace(/```json\s*/gi, '')
          .replace(/```\s*$/gm, '')
          .trim()
        cleanText = cleanText.replace(/^```.*$/gm, '').trim()
        cleanText = cleanText.replace(/\n+$/, '').trim()

        const jsonMatch = cleanText.match(/\{[\s\S]*?\}/s)
        if (jsonMatch) {
          fallbackJsonContent = jsonMatch[0]
          console.log('🔧 Fallback Method 3 - Found JSON after cleaning')
        }
      }

      // Method 4: Handle unclosed think tags - look for JSON patterns anywhere
      if (!fallbackJsonContent) {
        console.log(
          '🔧 Fallback Method 4 - Looking for JSON patterns anywhere in response'
        )

        // Look for JSON wrapped in markdown first
        const markdownJsonMatch = fallbackText.match(
          /```json\s*(\{[\s\S]*?\})\s*```/s
        )
        if (markdownJsonMatch) {
          fallbackJsonContent = markdownJsonMatch[1]
          console.log('🔧 Fallback Method 4 - Found markdown-wrapped JSON')
        } else {
          // Look for any JSON object pattern
          const anyJsonMatch = fallbackText.match(
            /\{[\s\S]*?"inputType"[\s\S]*?\}/s
          )
          if (anyJsonMatch) {
            fallbackJsonContent = anyJsonMatch[0]
            console.log(
              '🔧 Fallback Method 4 - Found JSON pattern with inputType'
            )
          }
        }
      }

      // Method 5: Handle unclosed think tags with partial JSON at end
      if (!fallbackJsonContent) {
        const openThinkCount = (fallbackText.match(/<think>/g) || []).length
        const closeThinkCount = (fallbackText.match(/<\/think>/g) || []).length

        if (openThinkCount > closeThinkCount) {
          console.log(
            '🔧 Fallback Method 5 - Handling unclosed think tags, extracting content after <think>'
          )

          // Find the last <think> tag and extract everything after it
          const lastThinkIndex = fallbackText.lastIndexOf('<think>')
          if (lastThinkIndex !== -1) {
            const afterThink = fallbackText.substring(lastThinkIndex + 7).trim()
            console.log(
              '🔧 Fallback content after last <think>:',
              afterThink.substring(0, 200)
            )

            // Try to find any structured content that looks like JSON fields
            const fieldPattern = /"?\w+"?\s*:\s*(?:"[^"]*"|true|false|\d+)/g
            const fields = afterThink.match(fieldPattern)

            if (fields && fields.length >= 3) {
              // Try to construct valid JSON from field patterns
              const jsonStr = '{' + fields.join(', ') + '}'
              console.log(
                '🔧 Fallback constructed JSON from fields:',
                jsonStr.substring(0, 200)
              )

              try {
                JSON.parse(jsonStr) // Test if it's valid
                fallbackJsonContent = jsonStr
                console.log(
                  '🔧 Fallback Method 5 - Successfully constructed JSON from field patterns'
                )
              } catch {
                console.log(
                  '🔧 Fallback Method 5 - Constructed JSON is invalid, trying direct extraction'
                )

                // Fallback: look for any JSON-like structure in the remaining content
                const jsonMatch = afterThink.match(/\{[\s\S]*?\}/s)
                if (jsonMatch) {
                  fallbackJsonContent = jsonMatch[0]
                  console.log(
                    '🔧 Fallback Method 5 - Found JSON pattern after <think>'
                  )
                }
              }
            }
          }
        }
      }

      fallbackText = fallbackJsonContent || fallbackText
      console.log(
        '🔧 Fallback after cleaning length:',
        fallbackText.length,
        'starts with:',
        fallbackText.substring(0, 50)
      )

      console.log('🔧 Fallback cleaned text:', fallbackText.substring(0, 200))
      const fallbackResult = JSON.parse(fallbackText)
      inputType = fallbackResult.inputType || 'question'

      // Handle needsSearch: user requested OR system determined
      const systemDeterminedSearch = fallbackResult.needsSearch || false
      needsSearch = input.searchRequested || systemDeterminedSearch

      isRiddle = fallbackResult.isRiddle || false
      riddleAnswer = fallbackResult.riddleAnswer
      searchableAnswer = fallbackResult.searchableAnswer
      // Ensure coreContent is never null or empty
      coreContent =
        fallbackResult.coreContent && fallbackResult.coreContent !== 'null'
          ? fallbackResult.coreContent
          : input.question

      // Extract other fields from fallback
      if (fallbackResult.userIntent) {
        userIntent = fallbackResult.userIntent
      }
      if (fallbackResult.answerStrategy) {
        answerStrategy = fallbackResult.answerStrategy
      }

      // Add riddle_solver badge if riddle was solved in fallback
      if (riddleAnswer) {
        badges.push({
          type: 'riddle_solver',
          earned: true,
          context: 'fallback_riddle_solved',
        })
      }
    } catch (fallbackError) {
      console.log('Fallback processing error:', fallbackError)
      // Final fallback to basic processing
      inputType = 'question'
      coreContent = input.question
      needsSearch = input.searchRequested || false
      isRiddle = false
    }
  }

  const output = {
    isRiddle,
    needsSearch,
    processedInput,
    riddleAnswer,
    searchableAnswer,
    userIntent,
    inputType,
    coreContent,
    badges,
    answerStrategy,
    actionWords,
  }

  console.log('InputProcessing stage output:', {
    isRiddle: output.isRiddle,
    needsSearch: output.needsSearch,
    userIntent: output.userIntent,
    searchableAnswer: output.searchableAnswer,
  })

  return output
}

export default inputProcessingStage
export type { InputProcessingInput, InputProcessingOutput }
