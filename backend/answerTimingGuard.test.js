'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  hasSuspiciousBurstInWindow,
  isExtremeSessionOutlier,
  normalizeAnswerEvents,
  answerEventsMatch,
  serializeAnswerEvents,
  parseAnswerEvents,
} = require('./answerTimingGuard')

const NOW = 1_000_000

function eventsAtOffsets(offsetsMs, reactionMs) {
  return offsetsMs.map((offset) => ({
    at: NOW - offset,
    reactionMs: typeof reactionMs === 'number' ? reactionMs : reactionMs,
  }))
}

describe('answerTimingGuard', () => {
  it('does not flag skilled human pacing in window', () => {
    const events = [
      { at: NOW - 58_000, reactionMs: 1200 },
      { at: NOW - 49_200, reactionMs: 1400 },
      { at: NOW - 41_500, reactionMs: 1300 },
      { at: NOW - 32_100, reactionMs: 1500 },
      { at: NOW - 24_800, reactionMs: 1250 },
      { at: NOW - 15_300, reactionMs: 1350 },
    ]
    assert.equal(hasSuspiciousBurstInWindow(events, NOW), false)
  })

  it('flags impossible burst in window', () => {
    const events = [
      { at: NOW - 10_000, reactionMs: 150 },
      { at: NOW - 9_000, reactionMs: 160 },
      { at: NOW - 8_000, reactionMs: 140 },
      { at: NOW - 7_000, reactionMs: 1200 },
      { at: NOW - 6_000, reactionMs: 1300 },
    ]
    assert.equal(hasSuspiciousBurstInWindow(events, NOW), true)
  })

  it('flags robotic tight jitter in window', () => {
    const events = eventsAtOffsets(
      [35_000, 34_000, 33_000, 32_000, 31_000, 30_000],
      830,
    )
    assert.equal(hasSuspiciousBurstInWindow(events, NOW), true)
  })

  it('isExtremeSessionOutlier', () => {
    assert.equal(isExtremeSessionOutlier(20_000, 60_000), true)
    assert.equal(isExtremeSessionOutlier(10_000, 60_000), false)
  })

  it('serialize parse and match events', () => {
    const events = [{ at: 100, reactionMs: 500 }, { at: 200, reactionMs: 600 }]
    const ser = serializeAnswerEvents(events)
    assert.equal(ser, '100:500,200:600')
    assert.deepEqual(parseAnswerEvents(ser), events)
    assert.equal(answerEventsMatch(events, parseAnswerEvents(ser)), true)
    assert.equal(normalizeAnswerEvents([{ at: 1.2, reactionMs: 500.7 }])[0].reactionMs, 501)
  })
})
