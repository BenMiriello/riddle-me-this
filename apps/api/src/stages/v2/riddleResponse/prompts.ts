interface PromptConfig {
  verbose: string
  concise: string
}

export const riddleGenerationPrompts: PromptConfig = {
  verbose: `Transform this answer into a masterful riddle using the principles of great riddle creation. Respond with ONLY the riddle text, nothing else.

RIDDLE CREATION METHODOLOGY:
1. CHARACTERISTIC MAPPING: Identify visual, auditory, tactile, functional, and metaphorical properties
2. PERSONIFICATION: Use "I am/have/can" format to give object human qualities
3. STRATEGIC AMBIGUITY: Create multiple possible interpretations initially
4. MISDIRECTION: Lead solver away from obvious category
5. FAIR SOLVABILITY: Include logical path to answer

QUALITY REQUIREMENTS:
✓ 2-4 lines maximum (brevity is essential)
✓ Uses metaphor/imagery (not literal description)
✓ Contains surprising twist that recontextualizes familiar object
✓ Solvable through logical deduction
✓ Produces "Aha!" moment when solved
✓ No specialized knowledge required
✓ Flows well when spoken aloud

WINNING PATTERNS TO USE:
- Personification: "I am..." "I have..." "I can..."
- Contradiction: "I X but can't Y"
- Function misdirection: "What does X but isn't Y?"
- Physical paradox: "I exist but can't be touched"
- Temporal paradox: "I go up but never come down"

CONSTRUCTION TECHNIQUE:
- Start with the answer: {answerToRiddlefy}
- Map key characteristics (what makes it unique?)
- Create contradiction or paradox about its nature
- Add strategic misdirection
- Use strong, simple words
- Test for fair solvability

EXAMPLES OF EXCELLENCE:
"What has keys but can't open locks?" (Piano)
"The more you take, the more you leave behind" (Footsteps)
"I'm light as a feather, yet the strongest person can't hold me for five minutes" (Breath)

AVOID:
- Meta-commentary or explanations
- Poetry that doesn't riddle
- Limericks or simple rhyming
- Obvious literal descriptions
- Specialized knowledge requirements

CREATE ENIGMATIC RIDDLE (2-4 lines only):`,

  concise: `Transform this answer into a riddle. DO NOT include "Here's a riddle" or any introductory text. Return ONLY the riddle lines.

Answer: {answerToRiddlefy}

Use "I am/have/can" format, metaphors, contradictions. 2-4 lines maximum. Make it solvable but surprising.

Return the riddle lines only, nothing else:`,
}

export const qualityAssessmentPrompts: PromptConfig = {
  verbose: `Assess this riddle's quality using our standards and respond with EXACTLY this JSON format:

{
  "quality": 0-100,
  "hasPersonification": boolean,
  "hasMetaphor": boolean,
  "hasSurprisingTwist": boolean,
  "isSolvable": boolean,
  "isConcise": boolean,
  "feedback": "brief quality assessment",
  "badges": ["riddle_artisan" | "quality_master" | "twist_genius"]
}

QUALITY SCORING:
- 90-100: Excellent riddle meeting all criteria
- 70-89: Good riddle with minor flaws
- 50-69: Adequate riddle needing improvement
- 30-49: Poor riddle with major issues
- 0-29: Failed riddle attempt

ASSESSMENT CRITERIA:
- Personification: Uses "I am/have/can" or gives object human qualities
- Metaphor: Describes familiar things in unfamiliar ways
- Surprising Twist: "I should have known!" moment when answered
- Solvable: Clear logical path exists to answer
- Concise: 2-4 lines, no unnecessary words

BADGE CRITERIA:
- riddle_artisan: Quality score >= 80
- quality_master: Perfect scores on all boolean criteria
- twist_genius: Exceptional surprising twist element

RIDDLE TO ASSESS: {riddle}
TARGET ANSWER: {answer}

Respond with ONLY the JSON object.`,

  concise: `Rate riddle quality 0-100. JSON:
{
  "quality": 0-100, 
  "hasPersonification": boolean,
  "hasMetaphor": boolean, 
  "hasSurprisingTwist": boolean,
  "isSolvable": boolean,
  "isConcise": boolean,
  "feedback": "brief assessment",
  "badges": ["riddle_artisan|quality_master|twist_genius"]
}

Riddle: {riddle}
Answer: {answer}

JSON only.`,
}
