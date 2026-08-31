import {
  ApiError,
  type ApiErrorResponse,
  type CalculateRequest,
  type CalculateResponse,
} from './types'

// In development, Vite proxies /api/* to the Go backend (see vite.config.ts).
// In production (e.g. Docker), the frontend is served by a static server /
// nginx that proxies /api/* to the backend container, so a relative path
// works in both environments without needing a build-time env var.
const API_BASE_URL = '/api'

/**
 * Calls the backend's /api/calculate endpoint.
 * Throws an ApiError with a human-readable message on any failure —
 * network errors, non-2xx responses, or unparsable responses.
 */
export async function calculate(
  request: CalculateRequest
): Promise<CalculateResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new ApiError(
      'Could not reach the calculator service. Check your connection and try again.'
    )
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError(
      'Received an unexpected response from the server.',
      response.status
    )
  }

  if (!response.ok) {
    const message =
      (body as ApiErrorResponse | undefined)?.error ??
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return body as CalculateResponse
}
