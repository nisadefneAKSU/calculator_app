import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '../api/calculatorClient'
import { useCalculator } from './useCalculator'

vi.mock('../api/calculatorClient', () => ({
  calculate: vi.fn(),
}))

const mockedCalculate = vi.mocked(client.calculate)

afterEach(() => {
  vi.resetAllMocks()
})

describe('useCalculator', () => {
  it('starts with a display of "0"', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.state.display).toBe('0')
  })

  it('builds up a number from digit presses', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.pressDigit('4'))
    act(() => result.current.pressDigit('2'))
    expect(result.current.state.display).toBe('42')
  })

  it('replaces the leading zero rather than appending', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.pressDigit('7'))
    expect(result.current.state.display).toBe('7')
  })

  it('only allows a single decimal point', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.pressDigit('1'))
    act(() => result.current.pressDecimal())
    act(() => result.current.pressDecimal())
    act(() => result.current.pressDigit('5'))
    expect(result.current.state.display).toBe('1.5')
  })

  it('toggles the sign of the current value', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.pressDigit('9'))
    act(() => result.current.pressToggleSign())
    expect(result.current.state.display).toBe('-9')
    act(() => result.current.pressToggleSign())
    expect(result.current.state.display).toBe('9')
  })

  it('backspaces one character at a time', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.pressDigit('1'))
    act(() => result.current.pressDigit('2'))
    act(() => result.current.pressDigit('3'))
    act(() => result.current.pressBackspace())
    expect(result.current.state.display).toBe('12')
  })

  it('performs a full add-then-equals flow via the API', async () => {
    mockedCalculate.mockResolvedValue({ result: 7, operation: 'add' })
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.pressDigit('3'))
    act(() => result.current.pressOperator('add'))
    act(() => result.current.pressDigit('4'))
    act(() => result.current.pressEquals())

    await waitFor(() => expect(result.current.state.display).toBe('7'))
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: 'add', a: 3, b: 4 })
    expect(result.current.state.pendingOperation).toBeNull()
    expect(result.current.state.history).toHaveLength(1)
  })

  it('chains operators without pressing equals in between', async () => {
    mockedCalculate.mockResolvedValueOnce({ result: 5, operation: 'add' }) // 2 + 3
    mockedCalculate.mockResolvedValueOnce({ result: 20, operation: 'multiply' }) // 5 * 4
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.pressDigit('2'))
    act(() => result.current.pressOperator('add'))
    act(() => result.current.pressDigit('3'))
    act(() => result.current.pressOperator('multiply')) // should resolve 2+3 first

    await waitFor(() => expect(result.current.state.pendingValue).toBe(5))

    act(() => result.current.pressDigit('4'))
    act(() => result.current.pressEquals())

    await waitFor(() => expect(result.current.state.display).toBe('20'))
    expect(mockedCalculate).toHaveBeenNthCalledWith(1, { operation: 'add', a: 2, b: 3 })
    expect(mockedCalculate).toHaveBeenNthCalledWith(2, { operation: 'multiply', a: 5, b: 4 })
  })

  it('calls sqrt with only a single operand', async () => {
    mockedCalculate.mockResolvedValue({ result: 4, operation: 'sqrt' })
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.pressDigit('1'))
    act(() => result.current.pressDigit('6'))
    act(() => result.current.pressSqrt())

    await waitFor(() => expect(result.current.state.display).toBe('4'))
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: 'sqrt', a: 16, b: undefined })
  })

  it('surfaces an API error and blocks further input until Clear', async () => {
    const { ApiError } = await import('../api/types')
    mockedCalculate.mockRejectedValue(new ApiError('division by zero is not allowed'))
    const { result } = renderHook(() => useCalculator())

    act(() => result.current.pressDigit('5'))
    act(() => result.current.pressOperator('divide'))
    act(() => result.current.pressDigit('0'))
    act(() => result.current.pressEquals())

    await waitFor(() =>
      expect(result.current.state.error).toBe('division by zero is not allowed')
    )

    act(() => result.current.pressDigit('9'))
    expect(result.current.state.display).not.toBe('9') // digit press ignored while in error state

    act(() => result.current.pressClear())
    expect(result.current.state.error).toBeNull()
    expect(result.current.state.display).toBe('0')
  })

  it('clears all state back to defaults', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => result.current.pressDigit('9'))
    act(() => result.current.pressOperator('add'))
    act(() => result.current.pressClear())

    expect(result.current.state.display).toBe('0')
    expect(result.current.state.pendingOperation).toBeNull()
    expect(result.current.state.history).toHaveLength(0)
  })
})
