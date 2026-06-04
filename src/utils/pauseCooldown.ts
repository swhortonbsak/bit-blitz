const KEY = 'bit-blitz-last-pause'
export const PAUSE_COOLDOWN_MS = 15 * 60 * 1000

function getLastPauseAt(): number {
  try {
    const v = localStorage.getItem(KEY)
    return v ? Math.max(0, parseInt(v, 10)) : 0
  } catch {
    return 0
  }
}

export function canPauseNow(): boolean {
  const last = getLastPauseAt()
  if (last === 0) return true
  return Date.now() - last >= PAUSE_COOLDOWN_MS
}

export function recordPauseUsed(): void {
  try {
    localStorage.setItem(KEY, String(Date.now()))
  } catch {
    // ignore storage failures
  }
}

export function msUntilPauseAvailable(): number {
  const last = getLastPauseAt()
  if (last === 0) return 0
  return Math.max(0, PAUSE_COOLDOWN_MS - (Date.now() - last))
}
