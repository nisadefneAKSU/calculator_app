import { describe, expect, it } from 'vitest'
import { formatNumber } from './formatNumber'

describe('formatNumber', () => {
  it('formats plain integers as-is', () => {
    expect(formatNumber(5)).toBe('5')
    expect(formatNumber(-12)).toBe('-12')
  })

  it('strips floating-point noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3')
  })

  it('normalizes negative zero to zero', () => {
    expect(formatNumber(-0)).toBe('0')
  })

  it('returns "Error" for non-finite values', () => {
    expect(formatNumber(Infinity)).toBe('Error')
    expect(formatNumber(-Infinity)).toBe('Error')
    expect(formatNumber(NaN)).toBe('Error')
  })

  it('uses exponential notation for very large numbers', () => {
    expect(formatNumber(1e20)).toContain('e+')
  })

  it('uses exponential notation for very small non-zero numbers', () => {
    expect(formatNumber(1e-12)).toContain('e-')
  })

  it('keeps zero as "0", not exponential', () => {
    expect(formatNumber(0)).toBe('0')
  })
})
