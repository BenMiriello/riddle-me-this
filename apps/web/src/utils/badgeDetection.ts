interface RiddleBadge {
  id: string
  name: string
  description: string
  riddleText: string
  answer: string
  hardcodedResponse?: string
}

export const RIDDLE_BADGES: RiddleBadge[] = [
  {
    id: 'speak-friend',
    name: 'Speak, Friend, and Enter',
    description: 'Solved the riddle of the Doors of Durin',
    riddleText: 'Speak, friend, and enter.',
    answer: 'mellon',
    hardcodedResponse:
      '"Mellon": the Elvish word for friend. The doors open before you.',
  },
  {
    id: 'forbidden-kiss',
    name: 'The Forbidden Kiss',
    description: 'Unraveled the riddle of the Goblet of Fire',
    riddleText:
      "First think of the person who lives in disguise,\nWho deals in secrets and tells naught but lies.\nNext, tell me what's always the last thing to mend,\nThe middle of the middle and end of the end?\nAnd finally, give me the sound often heard\nDuring the search for a hard-to-find word.\nNow string them together, and answer me this,\nWhich creature would you be unwilling to kiss?",
    answer: 'spider',
    hardcodedResponse:
      'A spider: Combining "spy" (person in disguise), "d" (last to mend, middle of middle, end of end), and "er" (sound when searching for words).',
  },
  {
    id: 'sphinx-riddle',
    name: 'Riddle of the Sphinx',
    description: 'Answered the ancient riddle of ages',
    riddleText:
      'What walks on four legs in the morning, two legs at noon, and three legs in the evening?',
    answer: 'a man',
    hardcodedResponse:
      'Man: Crawling as a baby, walking upright in adulthood, and using a cane in old age.',
  },
  {
    id: 'golden-sting',
    name: 'Golden Sting',
    description: 'Found the heart that never beats',
    riddleText: "What has a heart that doesn't beat?",
    answer: 'an artichoke',
    hardcodedResponse:
      'An artichoke: It has a tender heart at its center, but no beating heart like an animal.',
  },
  {
    id: 'time-devourer',
    name: 'The Devourer',
    description: 'Recognized the relentless passage of time',
    riddleText:
      'This thing all things devours:\nBirds, beasts, trees, flowers;\nGnaws iron, bites steel;\nGrinds hard stones to meal;\nSlays king, ruins town,\nAnd beats mountain down.',
    answer: 'time',
    hardcodedResponse:
      'Time: The great devourer that consumes all things, from the smallest flower to the mightiest mountain.',
  },
  {
    id: 'who-are-you',
    name: 'Who Are You?',
    description: "Asked the Caterpillar's impossible question",
    riddleText: 'Can you stand on your head?',
    answer: '',
    hardcodedResponse:
      "Ah, The Caterpillar's riddle from Alice in Wonderland! Some questions have no answers, only wonder.",
  },
  {
    id: 'dragonborn-mindbender',
    name: 'Dragonborn Mindbender',
    description: 'Mastered the paradox of nothingness',
    riddleText:
      "What is better than a storm,\nmore evil than the devil,\nthe poor have it,\nthe rich need it,\nand if you eat it you'll die?",
    answer: 'nothing',
    hardcodedResponse:
      'Nothing: It fits all conditions perfectly. Nothing is better than a storm, more evil than the devil, the poor have nothing, the rich need nothing, and eating nothing will kill you.',
  },
  {
    id: 'keyboard-riddle',
    name: 'The Answer Is a Key',
    description: 'Solved the modern mystery of keys without locks',
    riddleText:
      'I have keys but no locks.\nI have space but no room.\nYou can enter but not go outside.\nWhat am I?',
    answer: 'a piano',
    hardcodedResponse:
      'A piano: With keys to press, space bar for spacing, and an enter key, but no physical locks or rooms.',
  },
  {
    id: 'echo-riddle',
    name: 'The Echo',
    description: 'Understood the voice without a mouth',
    riddleText:
      'I speak without a mouth and hear without ears.\nI have no body,\nbut I come alive with wind.\nWhat am I?',
    answer: 'an echo',
    hardcodedResponse:
      'An echo: The reflection of sound that seems to speak and hear, carried by the wind through mountains and valleys.',
  },
  {
    id: 'ton-of-bricks',
    name: 'A Ton of Bricks',
    description: 'Outsmarted the classic trick question',
    riddleText: 'What weighs more,\na ton of feathers or a ton of bricks?',
    answer: 'neither',
    hardcodedResponse:
      'Neither: They both weigh exactly one ton. The trick is in the phrasing!',
  },
  {
    id: 'vanishing-trail',
    name: 'Vanishing Trail',
    description: 'Followed the path that grows by taking',
    riddleText: 'The more you take,\nthe more you leave behind.\nWhat am I?',
    answer: 'footsteps',
    hardcodedResponse:
      'Footsteps: The more steps you take, the more footprints you leave behind you.',
  },
  {
    id: 'applause',
    name: 'Applause',
    description: 'Kept what was given away',
    riddleText: 'What can you keep after giving it to someone?',
    answer: 'your word',
    hardcodedResponse:
      'Your word: Once given as a promise, you keep it by honoring it, even though it was given to another.',
  },
  {
    id: 'always-bring-towel',
    name: 'Always Bring a Towel',
    description: 'Prepared for interstellar hitchhiking',
    riddleText: 'What is the most useful item for interstellar travel?',
    answer: 'a towel',
    hardcodedResponse:
      "A towel: According to the Hitchhiker's Guide to the Galaxy, the most massively useful thing any interstellar hitchhiker can carry.",
  },
  {
    id: 'dark-waters',
    name: 'Dark Waters',
    description: "Caught the riddle of Gollum's prey",
    riddleText:
      'Alive without breath,\nAs cold as death;\nNever thirsty,\never drinking,\nAll in mail never clinking.',
    answer: 'a fish',
    hardcodedResponse:
      'A fish: Alive without breathing air, cold-blooded, always drinking water through their gills, covered in scales like mail armor.',
  },
  {
    id: 'wind-dancer',
    name: 'The Wind Dancer',
    description: 'Danced without legs, breathed without lungs',
    riddleText:
      'No legs have I to dance,\nno lungs have I to breathe,\nno life have I to live or die,\nand yet I do all three.',
    answer: 'the wind',
    hardcodedResponse:
      'The wind: It dances through the air, moves like breath, seems alive in its motion, yet has no physical form.',
  },
  {
    id: 'majoras-doom',
    name: "Majora's Doom",
    description: 'Met with a terrible fate',
    riddleText: "You've met with a terrible fate, haven't you?",
    answer: '',
    hardcodedResponse:
      "The Happy Mask Salesman's ominous greeting from Majora's Mask: Some statements need no answer, only acknowledgment of fate.",
  },
  {
    id: 'whispering-mirror',
    name: 'The Whispering Mirror',
    description: 'Pondered the eternal cycle question',
    riddleText: 'Which came first, the phoenix or the flame?',
    answer: '',
    hardcodedResponse:
      "Luna Lovegood's riddle from Harry Potter: A question that loops back on itself, like the phoenix's cycle of rebirth.",
  },
  {
    id: 'letter-m',
    name: 'Letter Logic',
    description: 'Found the letter hiding in time',
    riddleText:
      'What comes once in a minute,\ntwice in a moment,\nbut never in a thousand years?',
    answer: 'the letter M',
    hardcodedResponse:
      'The letter M: It appears once in "minute", twice in "moment", but never in "thousand years".',
  },
]

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const removeArticles = (text: string): string => {
  return text
    .replace(/\b(a|an|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const isExactMatch = (input: string, target: string): boolean => {
  const normalizedInput = normalizeText(input)
  const normalizedTarget = normalizeText(target)

  // Direct match
  if (normalizedInput === normalizedTarget) return true

  // Match without articles
  const inputNoArticles = removeArticles(normalizedInput)
  const targetNoArticles = removeArticles(normalizedTarget)

  if (inputNoArticles === targetNoArticles) return true

  // Match with articles added/removed on either side
  const inputWithArticles = [
    'a ' + inputNoArticles,
    'an ' + inputNoArticles,
    'the ' + inputNoArticles,
  ]
  const targetWithArticles = [
    'a ' + targetNoArticles,
    'an ' + targetNoArticles,
    'the ' + targetNoArticles,
  ]

  for (const variant of inputWithArticles) {
    if (variant === normalizedTarget || variant === targetNoArticles)
      return true
  }

  for (const variant of targetWithArticles) {
    if (variant === normalizedInput || variant === inputNoArticles) return true
  }

  return false
}

export const detectRiddleBadge = (
  input: string
): { badge: RiddleBadge; tier: 'silver' | 'gold' } | null => {
  for (const badge of RIDDLE_BADGES) {
    // Check for exact riddle match (gold tier)
    if (isExactMatch(input, badge.riddleText)) {
      return { badge, tier: 'gold' }
    }

    // Check for exact answer match (silver tier) - only if answer exists
    if (badge.answer && isExactMatch(input, badge.answer)) {
      return { badge, tier: 'silver' }
    }

    // Special case handling for specific badges
    if (
      badge.id === 'letter-m' &&
      (isExactMatch(input, 'M') || isExactMatch(input, 'the letter M'))
    ) {
      return { badge, tier: 'silver' }
    }

    if (badge.id === 'speak-friend' && isExactMatch(input, 'friend')) {
      return { badge, tier: 'silver' }
    }
  }

  return null
}
