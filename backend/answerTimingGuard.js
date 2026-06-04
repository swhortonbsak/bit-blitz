'use strict'

const WINDOW_MS = 60_000
const IMPOSSIBLE_REACTION_MS = 180
const IMPOSSIBLE_BURST_MIN_SAMPLES = 5
const IMPOSSIBLE_BURST_THRESHOLD = 3
const UNIFORM_INTERVAL_TOLERANCE_MS = 120
const UNIFORM_INTERVAL_COUNT = 4
const ROBOTIC_CV_THRESHOLD = 0.12
const ROBOTIC_CV_MEDIAN_MS = 900
const ROBOTIC_CV_SAMPLES = 6
const EXTREME_SCORE_THRESHOLD = 15_000
const EXTREME_SESSION_MAX_MS = 120_000
const MAX_HISTORY = 20

function getEventsInWindow(events, now, windowMs = WINDOW_MS) {
  const cutoff = now - windowMs
  return events.filter((e) => e.at >= cutoff)
}

function getSubmissionIntervals(events) {
  if (events.length < 2) return []
  const sorted = [...events].sort((a, b) => a.at - b.at)
  const intervals = []
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i].at - sorted[i - 1].at)
  }
  return intervals
}

function intervalsAreUniform(intervals, count, toleranceMs) {
  if (intervals.length < count) return false
  const recent = intervals.slice(-count)
  const first = recent[0]
  return recent.every((gap) => Math.abs(gap - first) <= toleranceMs)
}

function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

function coefficientOfVariation(values) {
  if (values.length < 2) return 1
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 0) return 1
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance) / mean
}

function hasSuspiciousBurstInWindow(events, now, options = {}) {
  const windowMs = options.windowMs ?? WINDOW_MS
  const inWindow = getEventsInWindow(events, now, windowMs)
  if (!inWindow.length) return false

  const impossibleMs = options.impossibleMs ?? IMPOSSIBLE_REACTION_MS
  const impossibleMinSamples = options.impossibleMinSamples ?? IMPOSSIBLE_BURST_MIN_SAMPLES
  const impossibleThreshold = options.impossibleThreshold ?? IMPOSSIBLE_BURST_THRESHOLD
  if (inWindow.length >= impossibleMinSamples) {
    const fastCount = inWindow.filter((e) => e.reactionMs < impossibleMs).length
    if (fastCount >= impossibleThreshold) return true
  }

  const uniformToleranceMs = options.uniformToleranceMs ?? UNIFORM_INTERVAL_TOLERANCE_MS
  const uniformCount = options.uniformCount ?? UNIFORM_INTERVAL_COUNT
  const intervals = getSubmissionIntervals(inWindow)
  if (intervalsAreUniform(intervals, uniformCount, uniformToleranceMs)) return true

  const roboticSamples = options.roboticSamples ?? ROBOTIC_CV_SAMPLES
  const reactions = inWindow.slice(-roboticSamples).map((e) => e.reactionMs)
  if (reactions.length >= roboticSamples) {
    const med = median(reactions)
    const cv = coefficientOfVariation(reactions)
    const roboticCv = options.roboticCv ?? ROBOTIC_CV_THRESHOLD
    const roboticMedianMs = options.roboticMedianMs ?? ROBOTIC_CV_MEDIAN_MS
    if (cv < roboticCv && med < roboticMedianMs) return true
  }

  return false
}

function isExtremeSessionOutlier(score, sessionPlayMs) {
  return score > EXTREME_SCORE_THRESHOLD && sessionPlayMs < EXTREME_SESSION_MAX_MS
}

function normalizeAnswerEvents(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const item of raw) {
    if (item && typeof item === 'object' && item.at != null && item.reactionMs != null) {
      const at = Math.round(Number(item.at))
      const reactionMs = Math.round(Number(item.reactionMs))
      if (Number.isFinite(at) && Number.isFinite(reactionMs) && reactionMs >= 0) {
        out.push({ at, reactionMs })
      }
    }
  }
  return out.slice(-MAX_HISTORY)
}

function serializeAnswerEvents(events) {
  return normalizeAnswerEvents(events)
    .map((e) => `${e.at}:${e.reactionMs}`)
    .join(',')
}

function parseAnswerEvents(serialized) {
  if (!serialized) return []
  const events = []
  for (const part of serialized.split(',')) {
    const [atStr, msStr] = part.split(':')
    const at = Number(atStr)
    const reactionMs = Number(msStr)
    if (Number.isFinite(at) && Number.isFinite(reactionMs) && reactionMs >= 0) {
      events.push({ at: Math.round(at), reactionMs: Math.round(reactionMs) })
    }
  }
  return events
}

function answerEventsMatch(a, b) {
  const left = normalizeAnswerEvents(a)
  const right = normalizeAnswerEvents(b)
  if (left.length !== right.length) return false
  return left.every((e, i) => e.at === right[i].at && e.reactionMs === right[i].reactionMs)
}

module.exports = {
  WINDOW_MS,
  hasSuspiciousBurstInWindow,
  isExtremeSessionOutlier,
  normalizeAnswerEvents,
  serializeAnswerEvents,
  parseAnswerEvents,
  answerEventsMatch,
}
