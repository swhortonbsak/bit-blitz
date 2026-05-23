export type ConversionMode =
  | 'binary-to-denary'
  | 'denary-to-binary'
  | 'binary-to-hex'
  | 'hex-to-binary'
  | 'denary-to-hex'
  | 'hex-to-denary'
  | 'mixed'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type NumberSystem = 'binary' | 'denary' | 'hex'

export interface Question {
  id: string
  mode: Exclude<ConversionMode, 'mixed'>
  sourceType: NumberSystem
  targetType: NumberSystem
  sourceValue: string
  correctAnswer: string
  sourceLabel: string
  targetLabel: string
}

export interface LeaderboardEntry {
  id: string
  nickname: string
  score: number
  mode: ConversionMode
  difficulty: Difficulty
  timestamp: number
  accuracy: number
  questionsAnswered: number
  bestStreak: number
}

export type LeaderboardFilter =
  | 'all'
  | 'today'
  | 'week'
  | 'mode'
  | 'difficulty'

export interface GameConfig {
  mode: ConversionMode
  difficulty: Difficulty
}

export interface GameStats {
  score: number
  streak: number
  bestStreak: number
  correct: number
  incorrect: number
  hintsUsed: number
  questionsAnswered: number
}

/** Falling invader — displays the value students must convert */
export interface Threat {
  id: string
  questionId: string
  displayValue: string
  displayType: NumberSystem
  x: number
  /** 0 = top of sky, 1 = reached the bit defense line */
  progress: number
  exploding: boolean
}

export const MODE_LABELS: Record<ConversionMode, string> = {
  'binary-to-denary': 'Binary → Denary',
  'denary-to-binary': 'Denary → Binary',
  'binary-to-hex': 'Binary → Hex',
  'hex-to-binary': 'Hex → Binary',
  'denary-to-hex': 'Denary → Hex',
  'hex-to-denary': 'Hex → Denary',
  mixed: 'Mixed Assault',
}

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    hintsEnabled: boolean
    showPlaceValues: boolean
    /** How fast invaders fall (progress units per second) */
    fallSpeed: number
    scoreMultiplier: number
    spawnGap: number
  }
> = {
  easy: {
    hintsEnabled: true,
    showPlaceValues: true,
    fallSpeed: 0.055,
    scoreMultiplier: 1,
    spawnGap: 1.2,
  },
  medium: {
    hintsEnabled: true,
    showPlaceValues: false,
    fallSpeed: 0.2,
    scoreMultiplier: 1,
    spawnGap: 0.9,
  },
  hard: {
    hintsEnabled: false,
    showPlaceValues: false,
    fallSpeed: 0.32,
    scoreMultiplier: 1.5,
    spawnGap: 0.55,
  },
}

export const HEX_DIGITS = '0123456789ABCDEF'.split('')

export function getAnswerStyle(targetType: NumberSystem): 'bits' | 'denary' | 'hex' {
  if (targetType === 'binary') return 'bits'
  return targetType
}
