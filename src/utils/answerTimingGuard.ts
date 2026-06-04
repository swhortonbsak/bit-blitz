export const TIMING_TOLERANCE_MS = 250
export const MIN_EQUAL_INTERVALS = 3 // 4 submissions
const MAX_HISTORY = 10

export function recordSubmission(timestamps: number[], now: number): number[] {
  const next = [...timestamps, now]
  return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
}

export function getRecentIntervals(timestamps: number[]): number[] {
  if (timestamps.length < 2) return []
  const intervals: number[] = []
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1])
  }
  return intervals
}

function intervalsAreUniform(intervals: number[], toleranceMs = TIMING_TOLERANCE_MS): boolean {
  if (intervals.length < MIN_EQUAL_INTERVALS) return false
  const recent = intervals.slice(-MIN_EQUAL_INTERVALS)
  const first = recent[0]
  return recent.every((gap) => Math.abs(gap - first) <= toleranceMs)
}

export function hasUniformSubmissionPattern(
  timestamps: number[],
  toleranceMs = TIMING_TOLERANCE_MS,
): boolean {
  if (timestamps.length < MIN_EQUAL_INTERVALS + 1) return false
  const intervals = getRecentIntervals(timestamps)
  return intervalsAreUniform(intervals, toleranceMs)
}

export function hasUniformIntervalPattern(
  intervals: number[],
  toleranceMs = TIMING_TOLERANCE_MS,
): boolean {
  return intervalsAreUniform(intervals, toleranceMs)
}
