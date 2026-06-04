import { generateQuestion } from './questionGenerator'
import { computeRoundScore } from './scoring'
import type { GameConfig, GameStats, Question, Threat } from './types'
import { DIFFICULTY_CONFIG } from './types'

export type GamePhase = 'playing' | 'paused' | 'feedback' | 'gameover'

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
  threats: Threat[]
  questionSpawnedAt: number
  feedbackMessage: string | null
  feedbackCorrect: boolean | null
  lastScoreDelta: number | null
  shake: boolean
}

const MAX_LIVES = 3
const SESSION_TIME_SEC = 300
const BREACH_PROGRESS = 1
/** Minimum ms between question spawn and valid answer fire — prevents scripted instant answers */
const MIN_ANSWER_MS = 300

export function createInitialState(config: GameConfig): GameState {
  const diff = DIFFICULTY_CONFIG[config.difficulty]
  const { threats, primaryQuestion } = createThreats(config, diff.threatCount)
  return {
    phase: 'playing',
    config,
    question: primaryQuestion,
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
    threats,
    questionSpawnedAt: Date.now(),
    feedbackMessage: null,
    feedbackCorrect: null,
    lastScoreDelta: null,
    shake: false,
  }
}

export function createThreat(question: Question, x?: number): Threat {
  return {
    id: `t-${question.id}`,
    question,
    displayValue: question.sourceValue,
    displayType: question.sourceType,
    x: x ?? 15 + Math.random() * 70,
    progress: 0,
    exploding: false,
  }
}

function createThreats(
  config: GameConfig,
  count: number,
  firstQuestion?: Question,
): { threats: Threat[]; primaryQuestion: Question } {
  if (count <= 1) {
    const question = firstQuestion ?? generateQuestion(config.mode, config.difficulty)
    return { threats: [createThreat(question)], primaryQuestion: question }
  }
  // Insane mode — two threats with independent questions at fixed x positions
  const qA = firstQuestion ?? generateQuestion(config.mode, config.difficulty)
  let qB = generateQuestion(config.mode, config.difficulty)
  // Ensure the two bugs don't happen to show the same source value
  let attempts = 0
  while (qB.sourceValue === qA.sourceValue && attempts++ < 10) {
    qB = generateQuestion(config.mode, config.difficulty)
  }
  const threats: Threat[] = [
    { ...createThreat(qA), id: `t-${qA.id}-a`, x: 20 },
    { ...createThreat(qB), id: `t-${qB.id}-b`, x: 68 },
  ]
  return { threats, primaryQuestion: qA }
}

/** Returns the most-advanced (lowest on screen) active threat, used for targeting */
export function getPrimaryThreat(threats: Threat[]): Threat | null {
  const active = threats.filter((t) => !t.exploding)
  if (active.length === 0) return null
  return active.reduce((a, b) => (a.progress >= b.progress ? a : b))
}

export function tickGame(state: GameState, deltaSec: number): GameState {
  if (state.phase !== 'playing' || state.threats.length === 0) return state

  const diff = DIFFICULTY_CONFIG[state.config.difficulty]

  // Only tick the session timer when enabled
  const sessionTimeLeft = state.config.timerEnabled
    ? Math.max(0, state.sessionTimeLeft - deltaSec)
    : state.sessionTimeLeft

  const threats: Threat[] = state.threats.map((t) => ({
    ...t,
    progress: t.progress + diff.fallSpeed * deltaSec,
  }))

  let next: GameState = { ...state, sessionTimeLeft, threats, shake: false }

  if (state.config.timerEnabled && sessionTimeLeft <= 0) {
    return {
      ...next,
      sessionTimeLeft: 0,
      phase: 'gameover',
      feedbackMessage: 'Session over!',
      feedbackCorrect: false,
      lastScoreDelta: null,
      shake: false,
    }
  }

  // Breach if any threat reaches the launchpad line
  const breached = threats.find((t) => t.progress >= BREACH_PROGRESS)
  if (breached) {
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
    // Score based on the most advanced threat (highest pressure = best bonus)
    const primary = getPrimaryThreat(state.threats)
    const heightRemaining = primary ? 1 - primary.progress : 0.5
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
    // Only explode the primary threat — survivors keep falling (frozen during feedback)
    const primaryId = primary?.id
    return {
      ...state,
      phase: 'feedback',
      stats,
      lives,
      feedbackCorrect: true,
      feedbackMessage: message,
      lastScoreDelta: delta,
      threats: state.threats.map((t) =>
        t.id === primaryId ? { ...t, exploding: true } : t,
      ),
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

  const isPractice = state.config.difficulty === 'practice'
  const phase = !isPractice && lives <= 0 ? 'gameover' : 'feedback'
  return {
    ...state,
    phase,
    stats,
    lives: isPractice ? state.lives : lives,
    feedbackCorrect: false,
    feedbackMessage: message,
    lastScoreDelta: null,
    threats: [],
    shake: !isPractice,
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

export function fireAnswer(
  state: GameState,
  isCorrect: boolean,
  submittedAt?: number,
): GameState {
  if (state.phase !== 'playing') return state

  // Anti-cheat: reject impossibly fast answers (< MIN_ANSWER_MS since question spawned)
  const elapsed = (submittedAt ?? Date.now()) - state.questionSpawnedAt
  if (elapsed < MIN_ANSWER_MS) {
    return {
      ...state,
      shake: true,
      feedbackMessage: '⚠ Answer too fast — keep it fair!',
      feedbackCorrect: null,
    }
  }

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

  const diff = DIFFICULTY_CONFIG[state.config.difficulty]

  // Keep threats that survived (not exploding) — they carry their current progress
  const survivors = state.threats.filter((t) => !t.exploding)

  // Fill up to threatCount with fresh threats at unoccupied x positions
  const allXPositions = diff.threatCount === 2 ? [20, 68] : []
  const occupiedX = new Set(survivors.map((t) => t.x))
  const freeXPositions = allXPositions.filter((x) => !occupiedX.has(x))

  const newThreats = [...survivors]
  let freeIdx = 0
  while (newThreats.length < diff.threatCount) {
    const q = generateQuestion(state.config.mode, state.config.difficulty)
    const xPos =
      freeIdx < freeXPositions.length
        ? freeXPositions[freeIdx++]
        : 15 + Math.random() * 70
    const suffix = newThreats.length === 0 ? 'a' : 'b'
    newThreats.push({ ...createThreat(q, xPos), id: `t-${q.id}-${suffix}` })
  }

  // The primary (most advanced) threat's question is what the player answers next
  const primary = getPrimaryThreat(newThreats)
  const question = primary?.question ?? generateQuestion(state.config.mode, state.config.difficulty)

  return {
    ...state,
    phase: 'playing',
    question,
    bits: Array(8).fill(false) as boolean[],
    typedAnswer: '',
    hintVisible: false,
    hintUsedThisRound: false,
    wrongAttemptsThisRound: 0,
    threats: newThreats,
    questionSpawnedAt: Date.now(),
    feedbackMessage: null,
    feedbackCorrect: null,
    lastScoreDelta: null,
    shake: false,
  }
}

export function pauseGame(state: GameState): GameState {
  if (state.phase !== 'playing') return state
  return { ...state, phase: 'paused' }
}

export function resumeGame(state: GameState): GameState {
  if (state.phase !== 'paused') return state
  return { ...state, phase: 'playing' }
}

/** @deprecated use fireAnswer */
export const submitAnswer = fireAnswer
