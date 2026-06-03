import type { ConversionMode, Difficulty, LeaderboardEntry } from '../game/types'
import type { LeaderboardQuery } from './leaderboardStorage'
import { filterNickname, isNicknameAllowed, nicknameFilterMessage } from './leaderboardStorage'

const API_BASE = '/api/scores'
const SEAL_BASE = '/api/seal-score'

// Allow this module's fetch calls to pass through the anti-cheat fetch guard.
// The guard blocks any /api/* call not wrapped in __allowAppFetch.
function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const w = window as unknown as { __allowAppFetch?: (fn: () => unknown) => Promise<Response> }
  if (typeof w.__allowAppFetch === 'function') {
    return w.__allowAppFetch(() => fetch(input, init)) as Promise<Response>
  }
  return fetch(input, init)
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
}): Promise<string> {
  const res = await appFetch(SEAL_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Score could not be verified.')
  }
  const data = (await res.json()) as { token: string }
  return data.token
}

export async function saveScore(
  entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>,
  sealToken: string,
): Promise<LeaderboardEntry> {
  const nickname = filterNickname(entry.nickname)
  if (!isNicknameAllowed(nickname)) {
    throw new Error(nicknameFilterMessage())
  }

  const res = await appFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, nickname, sealToken, timerEnabled: entry.timerEnabled ?? true }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Failed to save score')
  }

  const data = (await res.json()) as { entry: LeaderboardEntry }
  return data.entry
}
