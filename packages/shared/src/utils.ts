export function validateDomain(
  domain: string,
  allowedDomains: string[]
): boolean {
  return allowedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  )
}

export function generateApiKey(): string {
  return (
    'rmt_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}
