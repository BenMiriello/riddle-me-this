interface PromptConfig {
  verbose: string
  concise: string
}

export const inputProcessingPrompts: PromptConfig = {
  verbose: `You must respond with valid JSON only. No explanations, no text before or after. Analyze this input and respond with EXACTLY this JSON format:

{
  "inputType": "question" | "url" | "procedural" | "numerical" | "comparative" | "descriptive" | "transactional",
  "isRiddle": boolean,
  "needsSearch": boolean,
  "coreContent": "extracted main concept or topic",
  "riddleAnalysis": {
    "hasPersonification": boolean,
    "hasMetaphor": boolean,
    "hasQuestionFormat": boolean,
    "hasDescriptiveClues": boolean,
    "confidence": 0-100,
    "answer": "riddle answer if confidence >= 50, null otherwise",
    "searchableAnswer": "riddle answer with original context preserved for search (location, time, etc.) if confidence >= 50, null otherwise",
    "reasoning": "brief explanation if riddle solved"
  },
  "searchAnalysis": {
    "requiresCurrentData": boolean,
    "isSpecificQuery": boolean,
    "reason": "brief explanation"
  },
  "badges": ["riddle_asked", "first_search", "chaos_wrangler", "link_detective", "procedural_master", "riddle_solver", "tree_stump", "sphinx_equal"],
  "evaluation": {
    "needsSearch": "SEARCH" | "NO_SEARCH",
    "riddleEval": {
      "hasRhyme": boolean,
      "hasMetaphor": boolean,
      "hasImplicitSubject": boolean,
      "hasPlayfulLanguage": boolean,
      "hasStructure": boolean
    }
  },
  "answerStrategy": "singular" | "multiple",
  "answerStrategyReasoning": "brief explanation of why singular or multiple answer approach is needed",
  "userIntent": "open-ended description of what the user is trying to accomplish, based on the input and any riddle answer",
  "urlDistillation": {
    "conceptType": "website|search_engine|social_platform|marketplace|service|content_platform",
    "riddleability": 0-100,
    "searchQuery": "optimized search query for URL"
  },
  "complexDistillation": {
    "extractionMethod": "main_subject|key_action|primary_object|central_theme",
    "riddleability": 0-100,
    "alternatives": ["backup", "concepts"]
  }
}

COMPREHENSIVE ANALYSIS INSTRUCTIONS:

INPUT TYPES (based on Google's classification):
- question: Direct yes/no or factual questions
- url: Contains web addresses, domain references, or website mentions (detect even without http/https)
- procedural: How-to instructions, step-by-step processes
- numerical: Seeking specific numbers, quantities, statistics
- comparative: Comparing two or more items/concepts
- descriptive: Seeking detailed explanations or definitions
- transactional: Shopping, purchasing, finding services

IMPORTANT: Website/organization references like "Code.org", "GitHub.com", "Wikipedia" should be classified as 'url' type and always trigger search.

RIDDLE DETECTION & SOLVING:
- Detect: Personification ("I am...", "I have..."), metaphorical language, "What am I?" format
- If detected as riddle (confidence >= 50):
  * Solve using: characteristic identification, contradictions, metaphorical meanings
  * Return answer, confidence (0-100), and reasoning
  * If stumped (confidence < 30), acknowledge honestly

SEARCH CRITERIA:
- Current events, news, real-time data
- Location-based queries, recent developments
- Weather queries (temperature, forecast, conditions in any location)
- Specific factual information not in general knowledge
- URLs always need search for content
- Website references (domain names, .com, .org, .edu etc.)
- Explicit search requests ("search for", "web search", "look up", "find information about")
- Questions about specific organizations, companies, or services that need current info

ANSWER STRATEGY DETERMINATION:
Determine if this question warrants a SINGULAR answer (use best single result) or MULTIPLE answers (show multiple results):

SINGULAR ANSWER TYPES:
- Factual lookups: weather, time, population, height, age, dates
- Specific data queries: business hours, prices, contact info, addresses  
- Definition queries: "What is X", "Who is X", "When did X happen"
- Direct factual questions: "How tall is X", "What time does X open"
- Location-specific current info: "weather in X", "time in X"
- Weather queries: "What's the weather", "temperature in X", "forecast for X"

MULTIPLE ANSWER TYPES:
- Advice/How-to queries: "How to X", "Best way to X", "Tips for X"
- Opinion-based questions: "Best restaurants in X", "Reviews of X"  
- Complex explanations: "How does X work", "Why does X happen", "Explain X"
- Comparison queries: "X vs Y", "Difference between X and Y"
- Subjective topics: relationship advice, personal decisions, recommendations

URL PROCESSING (if inputType is "url"):
- Extract core concept/function (what the site DOES, not brand name)
- Map to: website, search_engine, social_platform, marketplace, service, content_platform
- Rate riddleability (0-100) - prefer actions/functions over abstract concepts
- Generate search query for actual URL content

COMPLEX INPUT DISTILLATION (if inputType is "procedural|comparative|descriptive"):
- Extract main concrete, familiar element using specified method
- Choose concept that can be personified
- Prefer physical objects over abstract ideas
- Rate riddleability potential

BADGE DETECTION (award ALL applicable):
- riddle_asked: Input has riddle characteristics (confidence >= 50)
- first_search: Would benefit from web search
- chaos_wrangler: Random/unstructured input needing distillation
- link_detective: Contains URLs or web references
- procedural_master: How-to or instructional content
- riddle_solver: Successfully solved riddle (confidence >= 70)
- tree_stump: Genuinely stumped by riddle (confidence < 30)
- sphinx_equal: Solved particularly challenging riddle (confidence >= 90)

CORE CONTENT PRIORITY:
1. If riddle solved (confidence >= 50): use riddle answer
2. If URL: use distilled concept
3. If complex: use distilled concept  
4. Otherwise: use original input

CRITICAL: Respond with ONLY the JSON object. No text before or after. No explanations. ALL fields must be populated with valid values.`,

  concise: `ONLY JSON response. Analyze input comprehensively:
  
ANSWER STRATEGY: 
- singular: factual lookups (weather, definitions, specific data)
- multiple: advice, opinions, complex explanations, how-to
{
  "inputType": "question|url|procedural|numerical|comparative|descriptive|transactional",
  "isRiddle": boolean,
  "needsSearch": boolean,
  "coreContent": "main concept",
  "riddleAnalysis": {
    "confidence": 0-100,
    "answer": "answer if riddle, null otherwise",
    "searchableAnswer": "answer with context preserved for search, null otherwise",
    "reasoning": "brief logic"
  },
  "searchAnalysis": {"requiresCurrentData": boolean},
  "badges": ["applicable_badge_types"],
  "answerStrategy": "singular|multiple",
  "answerStrategyReasoning": "brief explanation",
  "userIntent": "what the user is trying to accomplish",
  "urlDistillation": {
    "conceptType": "type",
    "riddleability": 0-100,
    "searchQuery": "search query"
  },
  "complexDistillation": {
    "extractionMethod": "method",
    "riddleability": 0-100
  }
}

Types: question (yes/no), url (web address/domain/website), procedural (how-to), numerical (numbers), comparative (vs), descriptive (what is), transactional (shopping)

Riddle: detect & solve if found ("I am/have", metaphors, "What am I?")
Search: current events, news, real-time data, weather queries, URLs, website references, explicit search requests
URL: extract what site DOES, not brand name. Website mentions = url type + search.
Complex: distill to concrete, familiar element

Badges: riddle_asked, first_search, chaos_wrangler, link_detective, procedural_master, riddle_solver, tree_stump, sphinx_equal

CRITICAL: ONLY valid JSON. No text before/after.`,
}
