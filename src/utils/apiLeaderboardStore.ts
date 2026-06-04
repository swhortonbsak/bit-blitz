import type { ConversionMode, Difficulty, LeaderboardEntry } from '../game/types'
import type { AnswerEvent } from './answerTimingGuard'
import type { LeaderboardQuery } from './leaderboardStorage'
import { filterNickname, isNicknameAllowed, nicknameFilterMessage } from './leaderboardStorage'

const API_BASE = '/api/scores'
const SEAL_BASE = '/api/seal-score'

export class CheatingDetectedError extends Error {
  readonly code = 'CHEATING_DETECTED'

  constructor(message = 'Cheating detected.') {
    super(message)
    this.name = 'CheatingDetectedError'
  }
}

// Allow this module's fetch calls to pass through the anti-cheat fetch guard.
// The guard blocks any /api/* call not wrapped in __allowAppFetch.
function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return err.message === 'Failed to fetch' || err.name === 'TypeError'
}

function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const run = () =>
    fetch(input, init).catch((err: unknown) => {
      if (isNetworkFailure(err)) {
        throw new Error('Could not reach the score server. Please check your connection and try again.')
      }
      throw err
    })

  const w = window as unknown as { __allowAppFetch?: (fn: () => unknown) => Promise<Response> }
  if (typeof w.__allowAppFetch === 'function') {
    return w.__allowAppFetch(run) as Promise<Response>
  }
  return run()
}

async function parseApiError(res: Response, fallback: string): Promise<never> {
  const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
  if (res.status === 403 && err.code === 'CHEATING_DETECTED') {
    throw new CheatingDetectedError(err.error ?? 'Cheating detected.')
  }
  throw new Error(err.error ?? fallback)
}

export async function queryScores(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams()
  params.set('filter', query.filter)
  if (query.mode) params.set('mode', query.mode)
  if (query.difficulty) params.set('difficulty', query.difficulty)
  if (query.timerEnabled !== undefined) params.set('timerEnabled', String(query.timerEnabled))

  const res = await appFetch(`${API_BASE}?${params}`)
  if (!res.ok) throw new Error(`Failed to load scores (${res.status})`)
  const data = (await res.json()) as { entries: LeaderboardEntry[] }
  return data.entries
}

/** Called the moment the game ends. Returns a single-use server-signed token
 *  that proves the score was achieved legitimately. Required by saveScore. */
export async function sealScore(params: {
  score: number
  questionsAnswered: number
  difficulty: Difficulty
  mode: ConversionMode
  timerEnabled: boolean
  answerEvents: AnswerEvent[]
  sessionPlayMs: number
}): Promise<string> {
  const res = await appFetch(SEAL_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) await parseApiError(res, 'Score could not be verified.')
  const data = (await res.json()) as { token: string }
  return data.token
}

export async function saveScore(
  entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>,
  sealToken: string,
  answerEvents: AnswerEvent[],
  sessionPlayMs: number,
): Promise<LeaderboardEntry> {
  const nickname = filterNickname(entry.nickname)
  if (!isNicknameAllowed(nickname)) {
    throw new Error(nicknameFilterMessage())
  }

  const res = await appFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...entry,
      nickname,
      sealToken,
      timerEnabled: entry.timerEnabled ?? true,
      answerEvents,
      sessionPlayMs,
    }),
  })

  if (!res.ok) await parseApiError(res, 'Failed to save score')

  const data = (await res.json()) as { entry: LeaderboardEntry }
  return data.entry
}
