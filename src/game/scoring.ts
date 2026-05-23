import type { Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'

const BASE_SCORE = 100
const MAX_SPEED_BONUS = 60
const HINT_PENALTY = 25
const WRONG_PENALTY = 10

export function computeRoundScore(params: {
  difficulty: Difficulty
  /** 1 - threat.progress at moment of blast — higher = faster kill */
  heightRemaining: number
  streak: number
  hintUsedThisRound: boolean
  wrongAttemptsThisRound: number
}): number {
  const { difficulty, heightRemaining, streak, hintUsedThisRound, wrongAttemptsThisRound } =
    params
  const config = DIFFICULTY_CONFIG[difficulty]

  const speedBonus = Math.round(MAX_SPEED_BONUS * Math.max(0, Math.min(1, heightRemaining)))
  const streakMultiplier = 1 + Math.min(streak, 10) * 0.1

  let score = (BASE_SCORE + speedBonus) * streakMultiplier * config.scoreMultiplier

  if (hintUsedThisRound) score -= HINT_PENALTY
  score -= wrongAttemptsThisRound * WRONG_PENALTY

  return Math.max(10, Math.round(score))
}

export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}
