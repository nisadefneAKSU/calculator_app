import { OPERATION_SYMBOLS } from '../hooks/useCalculator'
import type { Operation } from '../api/types'
import './Display.css'

interface DisplayProps {
  value: string
  pendingOperation: Operation | null
  pendingValue: number | null
  error: string | null
  isLoading: boolean
}

export function Display({ value, pendingOperation, pendingValue, error, isLoading }: DisplayProps) {
  const contextLine =
    pendingOperation && pendingValue !== null
      ? `${pendingValue} ${OPERATION_SYMBOLS[pendingOperation]}`
      : '\u00a0'

  return (
    <div className="display" role="status" aria-live="polite">
      <div className="display__context">{error ? 'Error' : contextLine}</div>
      <div className={`display__value ${error ? 'display__value--error' : ''}`}>
        {isLoading ? '\u2026' : error ? error : value}
      </div>
    </div>
  )
}
