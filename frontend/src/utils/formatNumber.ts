// Formats a numeric result for display, guarding against floating-point
// artifacts (e.g. 0.1 + 0.2 producing 0.30000000000000004) and negative
// zero, both of which look like bugs to an end user even though they're
// normal float behavior.
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error'
  }

  let n = value
  if (Object.is(n, -0)) {
    n = 0
  }

  // Use exponential notation for extremely large/small magnitudes so the
  // display never overflows into an unreadable wall of digits. This check
  // must happen before rounding, since rounding to 10 decimal places would
  // otherwise collapse small-but-legitimate values (e.g. 1e-12) to zero.
  if (n !== 0 && (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-9)) {
    return n.toExponential(6)
  }

  // Round to 10 decimal places to strip binary floating-point noise while
  // preserving legitimate precision for the vast majority of calculator use.
  const rounded = Math.round(n * 1e10) / 1e10

  return rounded.toString()
}
