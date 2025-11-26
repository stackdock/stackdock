/**
 * HTTP types for plugins
 */

export interface Request {
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body?: unknown
  params?: Record<string, string>
}

export interface Response {
  status: number
  headers?: Record<string, string>
  body?: unknown
}
