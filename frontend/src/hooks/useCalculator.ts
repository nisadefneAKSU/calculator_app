import { useCallback, useRef, useState } from 'react'
import { calculate } from '../api/calculatorClient'
import { ApiError, type Operation } from '../api/types'
import { formatNumber } from '../utils/formatNumber'

export interface HistoryEntry {
  id: number
  expression: string
  result: string
}

interface CalculatorState {
  display: string
  pendingOperation: Operation | null
  pendingValue: number | null
  waitingForNewInput: boolean
  error: string | null
  isLoading: boolean
  history: HistoryEntry[]
}

const MAX_DIGITS = 16

const initialState: CalculatorState = {
  display: '0',
  pendingOperation: null,
  pendingValue: null,
  waitingForNewInput: false,
  error: null,
  isLoading: false,
  history: [],
}

// Human-readable symbols used in the history log.
export const OPERATION_SYMBOLS: Record<Operation, string> = {
  add: '+',
  subtract: '\u2212',
  multiply: '\u00d7',
  divide: '\u00f7',
  power: '^',
  sqrt: '\u221a',
  percent: '%',
}

/**
 * Encapsulates all calculator state and behavior: digit entry, operator
 * chaining, and calls to the backend API. Kept as a plain hook (rather than
 * baked into the component) so the state machine can be unit tested with
 * @testing-library/react's renderHook, independent of any markup.
 */
export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(initialState)
  const historyIdRef = useRef(0)

  const pressDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.error) return prev // require Clear after an error

      if (prev.waitingForNewInput) {
        return { ...prev, display: digit, waitingForNewInput: false }
      }
      if (prev.display === '0') {
        return { ...prev, display: digit }
      }
      if (prev.display.replace(/[-.]/g, '').length >= MAX_DIGITS) {
        return prev // ignore further input past the display limit
      }
      return { ...prev, display: prev.display + digit }
    })
  }, [])

  const pressDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.error) return prev
      if (prev.waitingForNewInput) {
        return { ...prev, display: '0.', waitingForNewInput: false }
      }
      if (prev.display.includes('.')) return prev
      return { ...prev, display: prev.display + '.' }
    })
  }, [])

  const pressBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.error || prev.waitingForNewInput) return prev
      const next = prev.display.slice(0, -1)
      return { ...prev, display: next === '' || next === '-' ? '0' : next }
    })
  }, [])

  const pressToggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.error || prev.display === '0') return prev
      return {
        ...prev,
        display: prev.display.startsWith('-') ? prev.display.slice(1) : '-' + prev.display,
      }
    })
  }, [])

  const pressClear = useCallback(() => {
    setState({ ...initialState, history: [] })
  }, [])

  /** Calls the backend and commits the result (or error) to state. Returns
   * the numeric result on success, or null on failure. */
  const runCalculation = useCallback(
    async (
      operation: Operation,
      a: number,
      b: number | undefined,
      expressionLabel: string
    ): Promise<number | null> => {
      setState((prev) => ({ ...prev, isLoading: true }))
      try {
        const response = await calculate({ operation, a, b })
        const formatted = formatNumber(response.result)
        historyIdRef.current += 1
        setState((prev) => ({
          ...prev,
          display: formatted,
          isLoading: false,
          error: null,
          history: [
            { id: historyIdRef.current, expression: expressionLabel, result: formatted },
            ...prev.history,
          ].slice(0, 8),
        }))
        return response.result
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong.'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          pendingOperation: null,
          pendingValue: null,
          waitingForNewInput: true,
        }))
        return null
      }
    },
    []
  )

  const pressOperator = useCallback(
    (operation: Operation) => {
      if (state.error) return
      const currentValue = parseFloat(state.display)

      if (state.pendingOperation !== null && !state.waitingForNewInput) {
        // A first operand and operator are already pending, and the user has
        // typed a second number: resolve that calculation first (chaining),
        // then queue the newly pressed operator against the result.
        const a = state.pendingValue as number
        const symbol = OPERATION_SYMBOLS[state.pendingOperation]
        void runCalculation(
          state.pendingOperation,
          a,
          currentValue,
          `${formatNumber(a)} ${symbol} ${formatNumber(currentValue)}`
        ).then((result) => {
          if (result !== null) {
            setState((prev) => ({
              ...prev,
              pendingValue: result,
              pendingOperation: operation,
              waitingForNewInput: true,
            }))
          }
        })
        return
      }

      setState((prev) => ({
        ...prev,
        pendingValue: currentValue,
        pendingOperation: operation,
        waitingForNewInput: true,
      }))
    },
    [state.display, state.error, state.pendingOperation, state.pendingValue, state.waitingForNewInput, runCalculation]
  )

  const pressSqrt = useCallback(() => {
    if (state.error) return
    const a = parseFloat(state.display)
    void runCalculation('sqrt', a, undefined, `\u221a${formatNumber(a)}`)
  }, [state.display, state.error, runCalculation])

  const pressEquals = useCallback(() => {
    if (state.error) return
    if (state.pendingOperation === null || state.pendingValue === null) return

    const a = state.pendingValue
    const b = parseFloat(state.display)
    const symbol = OPERATION_SYMBOLS[state.pendingOperation]

    void runCalculation(
      state.pendingOperation,
      a,
      b,
      `${formatNumber(a)} ${symbol} ${formatNumber(b)}`
    ).then((result) => {
      if (result !== null) {
        setState((prev) => ({
          ...prev,
          pendingOperation: null,
          pendingValue: null,
          waitingForNewInput: true,
        }))
      }
    })
  }, [state.pendingOperation, state.pendingValue, state.display, state.error, runCalculation])

  return {
    state,
    pressDigit,
    pressDecimal,
    pressBackspace,
    pressToggleSign,
    pressClear,
    pressOperator,
    pressSqrt,
    pressEquals,
  }
}
