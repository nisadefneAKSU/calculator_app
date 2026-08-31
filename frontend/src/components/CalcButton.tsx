import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './CalcButton.css'

export type ButtonVariant = 'digit' | 'operator' | 'function' | 'equals'

interface CalcButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  wide?: boolean
}

/** A single calculator key. Presentational only — click behavior is wired
 * up by the parent Calculator component. */
export function CalcButton({
  children,
  variant = 'digit',
  wide = false,
  className,
  ...rest
}: CalcButtonProps) {
  const classes = ['calc-button', `calc-button--${variant}`, wide ? 'calc-button--wide' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
