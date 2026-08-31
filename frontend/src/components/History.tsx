import type { HistoryEntry } from '../hooks/useCalculator'
import './History.css'

interface HistoryProps {
  entries: HistoryEntry[]
}

export function History({ entries }: HistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="history history--empty">
        Your recent calculations will show up here.
      </div>
    )
  }

  return (
    <ul className="history">
      {entries.map((entry) => (
        <li key={entry.id} className="history__entry">
          <span className="history__expression">{entry.expression}</span>
          <span className="history__result">= {entry.result}</span>
        </li>
      ))}
    </ul>
  )
}
