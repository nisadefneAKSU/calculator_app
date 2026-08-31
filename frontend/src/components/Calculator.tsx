import { useCalculator } from '../hooks/useCalculator'
import { CalcButton } from './CalcButton'
import { Display } from './Display'
import { History } from './History'
import './Calculator.css'

export function Calculator() {
  const {
    state,
    pressDigit,
    pressDecimal,
    pressBackspace,
    pressToggleSign,
    pressClear,
    pressOperator,
    pressSqrt,
    pressEquals,
  } = useCalculator()

  const { isLoading } = state

  return (
    <div className="calculator" aria-label="Calculator">
      <Display
        value={state.display}
        pendingOperation={state.pendingOperation}
        pendingValue={state.pendingValue}
        error={state.error}
        isLoading={isLoading}
      />

      <div className="calculator__keypad">
        <CalcButton variant="function" onClick={pressClear} disabled={isLoading} aria-label="Clear">
          C
        </CalcButton>
        <CalcButton variant="function" onClick={pressToggleSign} disabled={isLoading} aria-label="Toggle sign">
          ±
        </CalcButton>
        <CalcButton variant="function" onClick={pressSqrt} disabled={isLoading} aria-label="Square root">
          √
        </CalcButton>
        <CalcButton variant="operator" onClick={() => pressOperator('divide')} disabled={isLoading} aria-label="Divide">
          ÷
        </CalcButton>

        <CalcButton onClick={() => pressDigit('7')} disabled={isLoading}>
          7
        </CalcButton>
        <CalcButton onClick={() => pressDigit('8')} disabled={isLoading}>
          8
        </CalcButton>
        <CalcButton onClick={() => pressDigit('9')} disabled={isLoading}>
          9
        </CalcButton>
        <CalcButton variant="operator" onClick={() => pressOperator('multiply')} disabled={isLoading} aria-label="Multiply">
          ×
        </CalcButton>

        <CalcButton onClick={() => pressDigit('4')} disabled={isLoading}>
          4
        </CalcButton>
        <CalcButton onClick={() => pressDigit('5')} disabled={isLoading}>
          5
        </CalcButton>
        <CalcButton onClick={() => pressDigit('6')} disabled={isLoading}>
          6
        </CalcButton>
        <CalcButton variant="operator" onClick={() => pressOperator('subtract')} disabled={isLoading} aria-label="Subtract">
          −
        </CalcButton>

        <CalcButton onClick={() => pressDigit('1')} disabled={isLoading}>
          1
        </CalcButton>
        <CalcButton onClick={() => pressDigit('2')} disabled={isLoading}>
          2
        </CalcButton>
        <CalcButton onClick={() => pressDigit('3')} disabled={isLoading}>
          3
        </CalcButton>
        <CalcButton variant="operator" onClick={() => pressOperator('add')} disabled={isLoading} aria-label="Add">
          +
        </CalcButton>

        <CalcButton variant="function" onClick={() => pressOperator('power')} disabled={isLoading} aria-label="Exponent">
          xʸ
        </CalcButton>
        <CalcButton onClick={() => pressDigit('0')} disabled={isLoading}>
          0
        </CalcButton>
        <CalcButton onClick={pressDecimal} disabled={isLoading} aria-label="Decimal point">
          .
        </CalcButton>
        <CalcButton variant="operator" onClick={() => pressOperator('percent')} disabled={isLoading} aria-label="Percent">
          %
        </CalcButton>

        <CalcButton variant="function" onClick={pressBackspace} disabled={isLoading} aria-label="Backspace" wide>
          ⌫
        </CalcButton>
        <CalcButton variant="equals" onClick={pressEquals} disabled={isLoading} aria-label="Equals" wide>
          =
        </CalcButton>
      </div>

      <div className="calculator__history">
        <h2 className="calculator__history-title">History</h2>
        <History entries={state.history} />
      </div>
    </div>
  )
}
