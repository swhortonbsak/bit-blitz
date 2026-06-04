import { describe, expect, it } from 'vitest'
import {
  getRecentIntervals,
  hasUniformIntervalPattern,
  hasUniformSubmissionPattern,
  recordSubmission,
  TIMING_TOLERANCE_MS,
} from './answerTimingGuard'

describe('answerTimingGuard', () => {
  it('does not detect with fewer than 4 submissions', () => {
    const ts = [1000, 2000, 3000]
    expect(hasUniformSubmissionPattern(ts)).toBe(false)
  })

  it('detects 4 submissions with equal gaps', () => {
    const ts = [1000, 2000, 3000, 4000]
    expect(hasUniformSubmissionPattern(ts)).toBe(true)
  })

  it('does not detect when one gap is uneven', () => {
    const ts = [1000, 2000, 3500, 4500]
    expect(hasUniformSubmissionPattern(ts)).toBe(false)
  })

  it('respects tolerance at boundary', () => {
    const base = [1000, 2000, 3000, 4000]
    expect(hasUniformSubmissionPattern(base, TIMING_TOLERANCE_MS)).toBe(true)

    const nearEdge = [1000, 2000, 3000, 4251]
    expect(hasUniformSubmissionPattern(nearEdge, TIMING_TOLERANCE_MS)).toBe(false)

    const within = [1000, 2000, 3000, 4249]
    expect(hasUniformSubmissionPattern(within, TIMING_TOLERANCE_MS)).toBe(true)
  })

  it('only checks trailing run after uneven gap in history', () => {
    const ts = [0, 5000, 6000, 7000, 8000]
    expect(hasUniformSubmissionPattern(ts)).toBe(true)
  })

  it('recordSubmission caps history', () => {
    let ts: number[] = []
    for (let i = 0; i < 12; i++) ts = recordSubmission(ts, i * 100)
    expect(ts).toHaveLength(10)
    expect(ts[0]).toBe(200)
  })

  it('getRecentIntervals returns gaps between timestamps', () => {
    expect(getRecentIntervals([1000, 1500, 2200])).toEqual([500, 700])
  })

  it('hasUniformIntervalPattern checks interval arrays directly', () => {
    expect(hasUniformIntervalPattern([1000, 1000, 1000])).toBe(true)
    expect(hasUniformIntervalPattern([1000, 900, 1000])).toBe(false)
  })
})
