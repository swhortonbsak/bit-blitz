import { generateQuestion } from './questionGenerator'
import { computeRoundScore } from './scoring'
import type { GameConfig, GameStats, Question, Threat } from './types'
import { DIFFICULTY_CONFIG } from './types'

export type GamePhase = 'playing' | 'feedback' | 'gameover'

export interface GameState {
  phase: GamePhase
  config: GameConfig
  question: Question
  stats: GameStats
  lives: number
  sessionTimeLeft: number
  bits: boolean[]
  typedAnswer: string
  hintVisible: boolean
  hintUsedThisRound: boolean
  wrongAttemptsThisRound: number
  threat: Threat | null
  feedbackMessage: string | null
  feedbackCorrect: boolean | null
  lastScoreDelta: number | null
  shake: boolean
}

const MAX_LIVES = 3
const SESSION_TIME_SEC = 300
const BREACH_PROGRESS = 1

export function createInitialState(config: GameConfig): GameState {
  const question = generateQuestion(config.mode, config.difficulty)
  return {
    phase: 'playing',
    config,
    question,
    stats: {
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      incorrect: 0,
      hintsUsed: 0,
      questionsAnswered: 0,
    },
    lives: MAX_LIVES,
    sessionTimeLeft: SESSION_TIME_SEC,
    bits: Array(8).fill(false) as boolean[],
    typedAnswer: '',
    hintVisible: false,
    hintUsedThisRound: false,
    wrongAttemptsThisRound: 0,
    threat: createThreat(question),
    feedbackMessage: null,
    feedbackCorrect: null,
    lastScoreDelta: null,
    shake: false,
  }
}

export function createThreat(question: Question): Threat {
  return {
    id: `t-${question.id}`,
    questionId: question.id,
    displayValue: question.sourceValue,
    displayType: question.sourceType,
    x: 15 + Math.random() * 70,
    progress: 0,
    exploding: false,
  }
}

export function tickGame(state: GameState, deltaSec: number): GameState {
  if (state.phase !== 'playing' || !state.threat) return state

  const diff = DIFFICULTY_CONFIG[state.config.difficulty]
  let sessionTimeLeft = Math.max(0, state.sessionTimeLeft - deltaSec)
  let threat: Threat = {
    ...state.threat,
    progress: state.threat.progress + diff.fallSpeed * deltaSec,
  }

  let next: GameState = { ...state, sessionTimeLeft, threat, shake: false }

  if (sessionTimeLeft <= 0) {
    return endRound(next, false, 'Session over!')
  }

  if (threat.progress >= BREACH_PROGRESS) {
    return endRound(
      next,
      false,
      `Breach! Set bits to ${state.question.correctAnswer} before they land.`,
    )
  }

  return next
}

function endRound(state: GameState, correct: boolean, message: string): GameState {
  let lives = state.lives
  let stats = { ...state.stats }

  if (correct) {
    const heightRemaining = state.threat ? 1 - state.threat.progress : 0.5
    const delta = computeRoundScore({
      difficulty: state.config.difficulty,
      heightRemaining,
      streak: stats.streak + 1,
      hintUsedThisRound: state.hintUsedThisRound,
      wrongAttemptsThisRound: state.wrongAttemptsThisRound,
    })
    const streak = stats.streak + 1
    stats = {
      ...stats,
      score: stats.score + delta,
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
      correct: stats.correct + 1,
      questionsAnswered: stats.questionsAnswered + 1,
    }
    return {
      ...state,
      phase: 'feedback',
      stats,
      lives,
      feedbackCorrect: true,
      feedbackMessage: message,
      lastScoreDelta: delta,
      threat: state.threat ? { ...state.threat, exploding: true } : null,
      shake: false,
    }
  }

  lives -= 1
  stats = {
    ...stats,
    incorrect: stats.incorrect + 1,
    streak: 0,
    questionsAnswered: stats.questionsAnswered + 1,
  }

  const phase = lives <= 0 ? 'gameover' : 'feedback'
  return {
    ...state,
    phase,
    stats,
    lives,
    feedbackCorrect: false,
    feedbackMessage: message,
    lastScoreDelta: null,
    threat: null,
    shake: true,
  }
}

export function flipBit(state: GameState, index: number): GameState {
  if (state.phase !== 'playing' || state.question.targetType !== 'binary') return state
  const bits = [...state.bits]
  bits[index] = !bits[index]
  const next = { ...state, bits }
  return tryAutoBlast(next)
}

export function setTypedAnswer(state: GameState, value: string): GameState {
  return { ...state, typedAnswer: value }
}

export function toggleHint(state: GameState): GameState {
  const diff = DIFFICULTY_CONFIG[state.config.difficulty]
  if (!diff.hintsEnabled || state.phase !== 'playing') return state
  const hintVisible = !state.hintVisible
  return {
    ...state,
    hintVisible,
    hintUsedThisRound: hintVisible ? true : state.hintUsedThisRound,
    stats: hintVisible
      ? { ...state.stats, hintsUsed: state.stats.hintsUsed + 1 }
      : state.stats,
  }
}

export function bitsToString(bits: boolean[]): string {
  return bits.map((b) => (b ? '1' : '0')).join('')
}

export function getCurrentAnswer(state: GameState): string {
  if (state.question.targetType === 'binary') return bitsToString(state.bits)
  return state.typedAnswer
}

function tryAutoBlast(state: GameState): GameState {
  // Optional instant blast when bits match — feels like the arcade original
  return state
}

export function fireAnswer(state: GameState, isCorrect: boolean): GameState {
  if (state.phase !== 'playing') return state

  if (isCorrect) {
    return endRound(state, true, 'BLAST! Invader destroyed!')
  }

  const wrongAttempts = state.wrongAttemptsThisRound + 1
  if (wrongAttempts < 2) {
    return {
      ...state,
      wrongAttemptsThisRound: wrongAttempts,
      shake: true,
      feedbackMessage: 'Misfire! Flip bits and FIRE again.',
      feedbackCorrect: null,
    }
  }

  return endRound(
    state,
    false,
    `Overloaded! Correct answer: ${state.question.correctAnswer}`,
  )
}

export function advanceRound(state: GameState): GameState {
  if (state.phase === 'gameover') return state

  const question = generateQuestion(state.config.mode, state.config.difficulty)

  return {
    ...state,
    phase: 'playing',
    question,
    bits: Array(8).fill(false) as boolean[],
    typedAnswer: '',
    hintVisible: false,
    hintUsedThisRound: false,
    wrongAttemptsThisRound: 0,
    threat: createThreat(question),
    feedbackMessage: null,
    feedbackCorrect: null,
    lastScoreDelta: null,
    shake: false,
  }
}

/** @deprecated use fireAnswer */
export const submitAnswer = fireAnswer
