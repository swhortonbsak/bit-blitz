const KEY = 'bit-blitz-high-score'

export function getHighScore(): number {
  try {
    const v = localStorage.getItem(KEY)
    return v ? Math.max(0, parseInt(v, 10)) : 0
  } catch {
    return 0
  }
}

export function updateHighScore(score: number): number {
  const current = getHighScore()
  if (score > current) {
    localStorage.setItem(KEY, String(score))
    return score
  }
  return current
}
