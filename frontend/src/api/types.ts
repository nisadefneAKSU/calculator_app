// Mirrors the Operation type on the Go backend (calculator/calculator.go).
export type Operation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percent'

export interface CalculateRequest {
  operation: Operation
  a: number
  b?: number
}

export interface CalculateResponse {
  result: number
  operation: Operation
}

export interface ApiErrorResponse {
  error: string
}

// Thrown by the api client when the backend returns a non-2xx response,
// or when the request fails outright (e.g. network error).
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Operations that only need a single operand ("a"). Kept in sync with the
// backend's operationsRequiringB map in handlers.go.
export const UNARY_OPERATIONS: ReadonlySet<Operation> = new Set(['sqrt'])
