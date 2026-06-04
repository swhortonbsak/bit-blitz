import { describe, expect, it } from 'vitest'
import {
  coefficientOfVariation,
  hasSuspiciousBurstInWindow,
  isExtremeSessionOutlier,
  median,
  recordAnswerEvent,
  type AnswerEvent,
} from './answerTimingGuard'

const NOW = 1_000_000

function eventsAtOffsets(
  offsetsMs: number[],
  reactionMs: number | number[],
): AnswerEvent[] {
  return offsetsMs.map((offset, i) => ({
    at: NOW - offset,
    reactionMs: Array.isArray(reactionMs) ? reactionMs[i] : reactionMs,
  }))
}

describe('answerTimingGuard', () => {
  it('does not flag with too few samples in window', () => {
    const events = eventsAtOffsets([50_000, 40_000, 30_000], 1200)
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(false)
  })

  it('flags impossible burst within 60s window', () => {
    const events = eventsAtOffsets(
      [10_000, 9_000, 8_000, 7_000, 6_000],
      [150, 160, 140, 1200, 1300],
    )
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(true)
  })

  it('does not flag old impossibly-fast answers outside window', () => {
    const events = eventsAtOffsets(
      [90_000, 80_000, 70_000, 10_000, 9_000, 8_000],
      [150, 160, 140, 1200, 1300, 1400],
    )
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(false)
  })

  it('does not flag steady human-paced play in window', () => {
    const events: AnswerEvent[] = [
      { at: NOW - 58_000, reactionMs: 1200 },
      { at: NOW - 49_200, reactionMs: 1400 },
      { at: NOW - 41_500, reactionMs: 1300 },
      { at: NOW - 32_100, reactionMs: 1500 },
      { at: NOW - 24_800, reactionMs: 1250 },
      { at: NOW - 15_300, reactionMs: 1350 },
    ]
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(false)
  })

  it('does not flag uniform submission gaps from steady human rhythm', () => {
    const events = eventsAtOffsets(
      [50_000, 49_000, 48_000, 47_000, 46_000],
      1000,
    )
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(false)
  })

  it('flags robotic tight jitter band in window', () => {
    const events = eventsAtOffsets(
      [35_000, 34_000, 33_000, 32_000, 31_000, 30_000],
      [820, 840, 830, 850, 825, 835],
    )
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(true)
  })

  it('does not flag wide humanDelay-style bands in window', () => {
    const events: AnswerEvent[] = [
      { at: NOW - 58_000, reactionMs: 900 },
      { at: NOW - 49_000, reactionMs: 1600 },
      { at: NOW - 40_500, reactionMs: 1200 },
      { at: NOW - 31_200, reactionMs: 2100 },
      { at: NOW - 23_700, reactionMs: 1800 },
      { at: NOW - 14_100, reactionMs: 1400 },
    ]
    expect(hasSuspiciousBurstInWindow(events, NOW)).toBe(false)
  })

  it('recordAnswerEvent caps history', () => {
    let events: AnswerEvent[] = []
    for (let i = 0; i < 25; i++) {
      events = recordAnswerEvent(events, i * 1000, 500 + i)
    }
    expect(events).toHaveLength(20)
    expect(events[0].reactionMs).toBe(505)
  })

  it('isExtremeSessionOutlier', () => {
    expect(isExtremeSessionOutlier(20_000, 60_000)).toBe(true)
    expect(isExtremeSessionOutlier(20_000, 150_000)).toBe(false)
    expect(isExtremeSessionOutlier(10_000, 60_000)).toBe(false)
  })

  it('median and coefficientOfVariation helpers', () => {
    expect(median([100, 200, 900])).toBe(200)
    expect(coefficientOfVariation([1000, 1000, 1000])).toBe(0)
    expect(coefficientOfVariation([800, 1200, 2000])).toBeGreaterThan(0.2)
  })
})
