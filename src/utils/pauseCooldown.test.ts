import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canPauseNow,
  msUntilPauseAvailable,
  PAUSE_COOLDOWN_MS,
  recordPauseUsed,
} from './pauseCooldown'

const KEY = 'bit-blitz-last-pause'

describe('pauseCooldown', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-04T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('allows pause when no prior record exists', () => {
    expect(canPauseNow()).toBe(true)
    expect(msUntilPauseAvailable()).toBe(0)
  })

  it('blocks pause within 15 minutes of recordPauseUsed', () => {
    recordPauseUsed()
    expect(canPauseNow()).toBe(false)
    expect(msUntilPauseAvailable()).toBe(PAUSE_COOLDOWN_MS)
  })

  it('allows pause again after 15 minutes', () => {
    recordPauseUsed()
    vi.advanceTimersByTime(PAUSE_COOLDOWN_MS)
    expect(canPauseNow()).toBe(true)
    expect(msUntilPauseAvailable()).toBe(0)
  })

  it('counts down remaining cooldown time', () => {
    recordPauseUsed()
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(canPauseNow()).toBe(false)
    expect(msUntilPauseAvailable()).toBe(10 * 60 * 1000)
  })

  it('persists last pause timestamp in localStorage', () => {
    recordPauseUsed()
    expect(localStorage.getItem(KEY)).toBe(String(Date.now()))
  })
})
