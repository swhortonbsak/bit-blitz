'use strict'

const TIMING_TOLERANCE_MS = 250
const MIN_EQUAL_INTERVALS = 3

function intervalsAreUniform(intervals, toleranceMs = TIMING_TOLERANCE_MS) {
  if (!Array.isArray(intervals) || intervals.length < MIN_EQUAL_INTERVALS) return false
  const recent = intervals.slice(-MIN_EQUAL_INTERVALS)
  if (!recent.every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0)) return false
  const first = recent[0]
  return recent.every((gap) => Math.abs(gap - first) <= toleranceMs)
}

function hasUniformIntervalPattern(intervals, toleranceMs = TIMING_TOLERANCE_MS) {
  return intervalsAreUniform(intervals, toleranceMs)
}

function normalizeAnswerIntervals(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((n) => Math.round(Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(-MIN_EQUAL_INTERVALS)
}

function serializeAnswerIntervals(intervals) {
  return normalizeAnswerIntervals(intervals).join(',')
}

function parseAnswerIntervals(serialized) {
  if (!serialized) return []
  return serialized.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n) && n > 0)
}

function intervalsMatch(a, b) {
  const left = normalizeAnswerIntervals(a)
  const right = normalizeAnswerIntervals(b)
  if (left.length !== right.length) return false
  return left.every((n, i) => n === right[i])
}

module.exports = {
  TIMING_TOLERANCE_MS,
  MIN_EQUAL_INTERVALS,
  hasUniformIntervalPattern,
  normalizeAnswerIntervals,
  serializeAnswerIntervals,
  parseAnswerIntervals,
  intervalsMatch,
}
