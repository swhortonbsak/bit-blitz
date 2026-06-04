export interface AnswerEvent {
  at: number
  reactionMs: number
}

export const WINDOW_MS = 60_000
export const IMPOSSIBLE_REACTION_MS = 180
export const IMPOSSIBLE_BURST_MIN_SAMPLES = 5
export const IMPOSSIBLE_BURST_THRESHOLD = 3
export const UNIFORM_INTERVAL_TOLERANCE_MS = 120
export const UNIFORM_INTERVAL_COUNT = 4
export const ROBOTIC_CV_THRESHOLD = 0.12
export const ROBOTIC_CV_MEDIAN_MS = 900
export const ROBOTIC_CV_SAMPLES = 6

export const EXTREME_SCORE_THRESHOLD = 15_000
export const EXTREME_SESSION_MAX_MS = 120_000

const MAX_HISTORY = 20

export function recordAnswerEvent(events: AnswerEvent[], at: number, reactionMs: number): AnswerEvent[] {
  const ms = Math.round(reactionMs)
  const ts = Math.round(at)
  if (!Number.isFinite(ms) || ms < 0 || !Number.isFinite(ts)) return events
  const next = [...events, { at: ts, reactionMs: ms }]
  return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
}

export function getEventsInWindow(events: AnswerEvent[], now: number, windowMs = WINDOW_MS): AnswerEvent[] {
  const cutoff = now - windowMs
  return events.filter((e) => e.at >= cutoff)
}

export function getSubmissionIntervals(events: AnswerEvent[]): number[] {
  if (events.length < 2) return []
  const sorted = [...events].sort((a, b) => a.at - b.at)
  const intervals: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i].at - sorted[i - 1].at)
  }
  return intervals
}

function intervalsAreUniform(intervals: number[], count: number, toleranceMs: number): boolean {
  if (intervals.length < count) return false
  const recent = intervals.slice(-count)
  const first = recent[0]
  return recent.every((gap) => Math.abs(gap - first) <= toleranceMs)
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 1
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 0) return 1
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance) / mean
}

/**
 * Server-side: flags automation bursts only within the last WINDOW_MS.
 */
export function hasSuspiciousBurstInWindow(
  events: AnswerEvent[],
  now: number,
  options?: {
    windowMs?: number
    impossibleMs?: number
    impossibleMinSamples?: number
    impossibleThreshold?: number
    uniformToleranceMs?: number
    uniformCount?: number
    roboticCv?: number
    roboticMedianMs?: number
    roboticSamples?: number
  },
): boolean {
  const windowMs = options?.windowMs ?? WINDOW_MS
  const inWindow = getEventsInWindow(events, now, windowMs)
  if (inWindow.length === 0) return false

  const impossibleMs = options?.impossibleMs ?? IMPOSSIBLE_REACTION_MS
  const impossibleMinSamples = options?.impossibleMinSamples ?? IMPOSSIBLE_BURST_MIN_SAMPLES
  const impossibleThreshold = options?.impossibleThreshold ?? IMPOSSIBLE_BURST_THRESHOLD
  if (inWindow.length >= impossibleMinSamples) {
    const fastCount = inWindow.filter((e) => e.reactionMs < impossibleMs).length
    if (fastCount >= impossibleThreshold) return true
  }

  const uniformToleranceMs = options?.uniformToleranceMs ?? UNIFORM_INTERVAL_TOLERANCE_MS
  const uniformCount = options?.uniformCount ?? UNIFORM_INTERVAL_COUNT
  const intervals = getSubmissionIntervals(inWindow)
  if (intervalsAreUniform(intervals, uniformCount, uniformToleranceMs)) return true

  const roboticSamples = options?.roboticSamples ?? ROBOTIC_CV_SAMPLES
  const reactions = inWindow.slice(-roboticSamples).map((e) => e.reactionMs)
  if (reactions.length >= roboticSamples) {
    const med = median(reactions)
    const cv = coefficientOfVariation(reactions)
    const roboticCv = options?.roboticCv ?? ROBOTIC_CV_THRESHOLD
    const roboticMedianMs = options?.roboticMedianMs ?? ROBOTIC_CV_MEDIAN_MS
    if (cv < roboticCv && med < roboticMedianMs) return true
  }

  return false
}

/** Extreme outlier: very high score in under 2 minutes wall-clock */
export function isExtremeSessionOutlier(
  score: number,
  sessionPlayMs: number,
): boolean {
  if (typeof score !== 'number' || typeof sessionPlayMs !== 'number') return false
  return score > EXTREME_SCORE_THRESHOLD && sessionPlayMs < EXTREME_SESSION_MAX_MS
}

export function normalizeAnswerEvents(raw: unknown): AnswerEvent[] {
  if (!Array.isArray(raw)) return []
  const out: AnswerEvent[] = []
  for (const item of raw) {
    if (item && typeof item === 'object' && 'at' in item && 'reactionMs' in item) {
      const at = Math.round(Number((item as AnswerEvent).at))
      const reactionMs = Math.round(Number((item as AnswerEvent).reactionMs))
      if (Number.isFinite(at) && Number.isFinite(reactionMs) && reactionMs >= 0) {
        out.push({ at, reactionMs })
      }
    }
  }
  return out.slice(-MAX_HISTORY)
}

export function serializeAnswerEvents(events: AnswerEvent[]): string {
  return normalizeAnswerEvents(events)
    .map((e) => `${e.at}:${e.reactionMs}`)
    .join(',')
}

export function parseAnswerEvents(serialized: string): AnswerEvent[] {
  if (!serialized) return []
  const events: AnswerEvent[] = []
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

export function answerEventsMatch(a: AnswerEvent[], b: AnswerEvent[]): boolean {
  const left = normalizeAnswerEvents(a)
  const right = normalizeAnswerEvents(b)
  if (left.length !== right.length) return false
  return left.every((e, i) => e.at === right[i].at && e.reactionMs === right[i].reactionMs)
}
