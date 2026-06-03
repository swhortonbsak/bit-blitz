import type { LeaderboardEntry } from '../game/types'
import type { LeaderboardQuery } from './leaderboardStorage'
import { filterNickname, isNicknameAllowed, nicknameFilterMessage } from './leaderboardStorage'

const API_BASE = '/api/scores'

export async function queryScores(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams()
  params.set('filter', query.filter)
  if (query.mode) params.set('mode', query.mode)
  if (query.difficulty) params.set('difficulty', query.difficulty)
  if (query.timerEnabled !== undefined) params.set('timerEnabled', String(query.timerEnabled))

  const res = await fetch(`${API_BASE}?${params}`)
  if (!res.ok) throw new Error(`Failed to load scores (${res.status})`)
  const data = (await res.json()) as { entries: LeaderboardEntry[] }
  return data.entries
}

export async function saveScore(
  entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>,
): Promise<LeaderboardEntry> {
  const nickname = filterNickname(entry.nickname)
  if (!isNicknameAllowed(nickname)) {
    throw new Error(nicknameFilterMessage())
  }

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, nickname, timerEnabled: entry.timerEnabled ?? true }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Failed to save score')
  }

  const data = (await res.json()) as { entry: LeaderboardEntry }
  return data.entry
}
