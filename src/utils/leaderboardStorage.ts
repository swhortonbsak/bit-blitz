import type { ConversionMode, Difficulty, LeaderboardEntry, LeaderboardFilter } from '../game/types'

const STORAGE_KEY = 'bit-blitz-leaderboard-v1'
const MAX_ENTRIES = 500
const NICKNAME_MAX = 12

const BLOCKED = [
  'damn',
  'hell',
  'crap',
  'shit',
  'fuck',
  'fuk',
  'ass',
  'bitch',
  'bastard',
  'dick',
  'piss',
  'slut',
  'whore',
]

export interface LeaderboardQuery {
  filter: LeaderboardFilter
  mode?: ConversionMode
  difficulty?: Difficulty
}

/** Backend-ready interface */
export interface LeaderboardStore {
  getAll(): LeaderboardEntry[]
  save(entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): LeaderboardEntry
  clear(): void
  query(query: LeaderboardQuery): LeaderboardEntry[]
}

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LeaderboardEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(entries: LeaderboardEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
}

export function filterNickname(raw: string): string {
  return raw.trim().slice(0, NICKNAME_MAX)
}

export function isNicknameAllowed(nickname: string): boolean {
  const n = filterNickname(nickname)
  if (!n) return false
  const lower = n.toLowerCase()
  return !BLOCKED.some((w) => lower.includes(w))
}

export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfWeek(): number {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const localLeaderboardStore: LeaderboardStore = {
  getAll() {
    return load().sort((a, b) => b.score - a.score)
  },

  save(entry) {
    const full: LeaderboardEntry = {
      ...entry,
      id: `lb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      nickname: filterNickname(entry.nickname),
    }
    const entries = [full, ...load()].sort((a, b) => b.score - a.score)
    persist(entries)
    return full
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },

  query(query) {
    let list = load()

    if (query.filter === 'today') {
      const start = startOfToday()
      list = list.filter((e) => e.timestamp >= start)
    } else if (query.filter === 'week') {
      const start = startOfWeek()
      list = list.filter((e) => e.timestamp >= start)
    }

    if (query.mode) {
      list = list.filter((e) => e.mode === query.mode)
    }
    if (query.difficulty) {
      list = list.filter((e) => e.difficulty === query.difficulty)
    }

    return list.sort((a, b) => b.score - a.score).slice(0, 50)
  },
}

export function resetLocalLeaderboard(): void {
  localLeaderboardStore.clear()
}
