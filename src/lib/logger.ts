import { v4 as uuidv4 } from 'uuid'

export interface LogContext {
  request_id: string
  user_id?: string
  op: string
  latency?: number
  [key: string]: unknown
}

export function createRequestId(): string {
  return uuidv4()
}

export function log(level: 'info' | 'error' | 'warn', message: string, context?: Partial<LogContext>) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...context
  }
  
  console.log(JSON.stringify(logEntry))
}