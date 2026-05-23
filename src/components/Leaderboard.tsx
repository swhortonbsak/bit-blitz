import { useMemo, useState } from 'react'
import { SoundToggle } from './SoundToggle'
import type { ConversionMode, Difficulty, LeaderboardFilter } from '../game/types'
import { MODE_LABELS } from '../game/types'
import {
  localLeaderboardStore,
  resetLocalLeaderboard,
} from '../utils/leaderboardStorage'

interface LeaderboardProps {
  onBack: () => void
}

const TIME_FILTERS: { id: LeaderboardFilter; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
]

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [timeFilter, setTimeFilter] = useState<LeaderboardFilter>('all')
  const [modeFilter, setModeFilter] = useState<ConversionMode | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>('')
  const [refresh, setRefresh] = useState(0)

  const entries = useMemo(() => {
    void refresh
    return localLeaderboardStore.query({
      filter: timeFilter,
      mode: modeFilter || undefined,
      difficulty: difficultyFilter || undefined,
    })
  }, [timeFilter, modeFilter, difficultyFilter, refresh])

  const handleReset = () => {
    if (
      window.confirm(
        'Reset the local leaderboard? This cannot be undone. (Teacher option)',
      )
    ) {
      resetLocalLeaderboard()
      setRefresh((r) => r + 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-pixel text-[#ffe566] text-lg sm:text-xl">HISCORES</h2>
        <div className="flex gap-2 items-center">
          <SoundToggle compact />
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#2a3558] font-pixel text-[10px] pixel-border"
        >
          Back
        </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setTimeFilter(f.id)}
            className={`px-3 py-1 text-lg pixel-border ${
              timeFilter === f.id ? 'bg-[#5ef0ff] text-[#0a0e1a]' : 'bg-[#12182b]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <span className="text-[#8a9bb8] text-lg">Filter by mode</span>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as ConversionMode | '')}
            className="mt-1 w-full p-2 bg-[#0a0e1a] border-2 border-[#2a3558] text-lg"
          >
            <option value="">All modes</option>
            {(Object.keys(MODE_LABELS) as ConversionMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[#8a9bb8] text-lg">Filter by difficulty</span>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | '')}
            className="mt-1 w-full p-2 bg-[#0a0e1a] border-2 border-[#2a3558] text-lg"
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto pixel-border">
        <table className="w-full text-left text-base sm:text-lg">
          <thead className="bg-[#12182b]">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Name</th>
              <th className="p-2">Score</th>
              <th className="p-2 hidden sm:table-cell">Mode</th>
              <th className="p-2 hidden md:table-cell">Diff</th>
              <th className="p-2 hidden lg:table-cell">Acc%</th>
              <th className="p-2 hidden lg:table-cell">Streak</th>
              <th className="p-2 hidden md:table-cell">When</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-[#8a9bb8]">
                  No scores yet — be the first!
                </td>
              </tr>
            ) : (
              entries.map((e, i) => (
                <tr key={e.id} className="border-t border-[#2a3558]">
                  <td className="p-2 text-[#ffe566]">{i + 1}</td>
                  <td className="p-2 font-bold">{e.nickname}</td>
                  <td className="p-2 text-[#b8ff5a]">{e.score}</td>
                  <td className="p-2 hidden sm:table-cell text-sm">
                    {MODE_LABELS[e.mode]}
                  </td>
                  <td className="p-2 hidden md:table-cell capitalize">{e.difficulty}</td>
                  <td className="p-2 hidden lg:table-cell">{e.accuracy}%</td>
                  <td className="p-2 hidden lg:table-cell">{e.bestStreak}</td>
                  <td className="p-2 hidden md:table-cell text-sm text-[#8a9bb8]">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="mt-6 text-[#ff4757] text-lg underline hover:no-underline"
      >
        Reset local leaderboard (teachers)
      </button>
    </div>
  )
}
