// Check if a word is reserved (is it a valid property name?)
export function isReservedKeyword(word: string): boolean {
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(word)) return false
  try {
    new Function(word, 'return true;')
    return false
  } catch (error) {
    return error instanceof SyntaxError
  }
}
