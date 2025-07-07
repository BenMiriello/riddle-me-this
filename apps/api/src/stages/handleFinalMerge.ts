interface FinalMergeInput {
  normalAnswer?: { response: string }
  genRiddle?: { riddle: string }
}

interface FinalMergeOutput {
  finalResponse: string
}

const handleFinalMerge = ({
  normalAnswer,
  genRiddle,
}: FinalMergeInput): FinalMergeOutput => {
  const finalResponse =
    normalAnswer?.response || genRiddle?.riddle || 'No response generated'

  return { finalResponse }
}

export default handleFinalMerge
