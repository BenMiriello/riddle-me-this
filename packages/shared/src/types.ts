export interface RiddleRequest {
  question: string
  apiKey: string
  domain: string
}

export interface RiddleResponse {
  answer: string
  summary: string
  timestamp: number
  success: boolean
  error?: string
}

export interface UserConfig {
  apiKey: string
  allowedDomains: string[]
  rateLimit: number
}
