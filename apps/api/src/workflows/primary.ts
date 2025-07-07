import { pipeline } from '../Pipeline'
import {
  riddleDetection,
  riddleDecipher,
  searchDetection,
  searchStage,
  knowledgeStage,
  answerGeneration,
  plainTextResponse,
  riddleGeneration,
  handleFinalMerge,
} from '../stages'

const needsSearch = (pl: {
  searchCheck: { result: { needsSearch: boolean } }
}) => pl.searchCheck.result.needsSearch

const mergeQuestion = (pl: {
  decipher?: { result?: { decipheredInput?: string } }
  detect?: { result?: { userInput?: string } }
}) => ({
  plainTextQuestion:
    pl.decipher?.result?.decipheredInput || pl.detect?.result?.userInput,
})

const answerInRiddle = (pl: { detect: { result: { isRiddle: boolean } } }) =>
  pl.detect.result.isRiddle

const workflow = pipeline()
  .step('detect', riddleDetection)
  .step('decipher', riddleDecipher, { when: 'detect.isRiddle' })
  .step('searchCheck', searchDetection, {
    merge: mergeQuestion,
    after: ['detect', 'decipher'] as const,
  })
  .branch({
    webSearch: { stage: searchStage, when: (pl) => needsSearch(pl) },
    knowledgeAnswer: { stage: knowledgeStage, when: (pl) => !needsSearch(pl) },
  })
  .step('answer', answerGeneration, {
    after: ['webSearch', 'knowledgeAnswer'] as const,
  })
  .branch({
    normalAnswer: {
      stage: plainTextResponse,
      when: (pl) => answerInRiddle(pl),
    },
    makeRiddle: { stage: riddleGeneration, when: (pl) => !answerInRiddle(pl) },
  })
  .merge('finalResponse', handleFinalMerge, {
    after: ['normalAnswer', 'makeRiddle'] as const,
  })
  .build()

export default workflow
