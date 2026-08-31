import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculate } from './calculatorClient'
import { ApiError } from './types'

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  )
}

describe('calculate (API client)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed result on a successful response', async () => {
    mockFetchOnce(200, { result: 5, operation: 'add' })

    const result = await calculate({ operation: 'add', a: 2, b: 3 })

    expect(result).toEqual({ result: 5, operation: 'add' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/calculate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ operation: 'add', a: 2, b: 3 }),
      })
    )
  })

  it('throws an ApiError with the backend message on a 400 response', async () => {
    mockFetchOnce(400, { error: 'division by zero is not allowed' })

    await expect(calculate({ operation: 'divide', a: 1, b: 0 })).rejects.toMatchObject(
      {
        message: 'division by zero is not allowed',
      }
    )
  })

  it('throws a generic ApiError when the network request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    )

    await expect(calculate({ operation: 'add', a: 1, b: 2 })).rejects.toBeInstanceOf(
      ApiError
    )
  })

  it('throws an ApiError when the response body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('invalid json')
        },
      })
    )

    await expect(calculate({ operation: 'add', a: 1, b: 2 })).rejects.toBeInstanceOf(
      ApiError
    )
  })
})
