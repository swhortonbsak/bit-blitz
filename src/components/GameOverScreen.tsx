import { accuracyPercent } from '../game/scoring'
import type { GameConfig, GameStats } from '../game/types'
import { MODE_LABELS } from '../game/types'
import {
  filterNickname,
  isNicknameAllowed,
  nicknameFilterMessage,
} from '../utils/leaderboardStorage'
import { saveScore } from '../utils/apiLeaderboardStore'
import { useState } from 'react'

interface GameOverScreenProps {
  config: GameConfig
  stats: GameStats
  onPlayAgain: () => void
  onMenu: () => void
  onLeaderboard: () => void
}

export function GameOverScreen({
  config,
  stats,
  onPlayAgain,
  onMenu,
  onLeaderboard,
}: GameOverScreenProps) {
  const [nickname, setNickname] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = stats.correct + stats.incorrect
  const accuracy = accuracyPercent(stats.correct, total)
  const isPractice = config.difficulty === 'practice'

  const handleSave = async () => {
    const n = filterNickname(nickname)
    if (!n) {
      setError('Please enter a nickname.')
      return
    }
    if (!isNicknameAllowed(n)) {
      setError(nicknameFilterMessage())
      return
    }
    setSaving(true)
    try {
      await saveScore({
        nickname: n,
        score: stats.score,
        mode: config.mode,
        difficulty: config.difficulty,
        timerEnabled: config.timerEnabled,
        accuracy,
        questionsAnswered: stats.questionsAnswered,
        bestStreak: stats.bestStreak,
      })
      setSaved(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : nicknameFilterMessage())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 className="font-pixel text-[#ff4757] text-xl sm:text-2xl mb-4">Game Over</h2>
      <p className="font-pixel text-[#b8ff5a] text-3xl sm:text-4xl mb-6">{stats.score} pts</p>

      <dl className="grid grid-cols-2 gap-3 text-lg mb-8 text-left bg-[#12182b] p-4 pixel-border">
        <dt className="text-[#8a9bb8]">Mode</dt>
        <dd>{MODE_LABELS[config.mode]}</dd>
        <dt className="text-[#8a9bb8]">Difficulty</dt>
        <dd className="capitalize">{config.difficulty}</dd>
        <dt className="text-[#8a9bb8]">Timer</dt>
        <dd>{config.timerEnabled ? '⏱ 5 min' : '∞ No limit'}</dd>
        <dt className="text-[#8a9bb8]">Accuracy</dt>
        <dd>{accuracy}%</dd>
        <dt className="text-[#8a9bb8]">Questions</dt>
        <dd>{stats.questionsAnswered}</dd>
        <dt className="text-[#8a9bb8]">Best streak</dt>
        <dd>{stats.bestStreak}</dd>
        <dt className="text-[#8a9bb8]">Correct</dt>
        <dd>{stats.correct}</dd>
      </dl>

      {isPractice ? (
        <p className="text-[#2ed573] text-xl mb-6">
          Practice mode — scores are not saved to the leaderboard.
        </p>
      ) : !saved ? (
        <div className="mb-6">
          <label htmlFor="nickname" className="block text-[#8a9bb8] text-xl mb-2">
            Nickname for leaderboard (max 12 chars, school-appropriate only)
          </label>
          <input
            id="nickname"
            type="text"
            maxLength={12}
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              if (error) setError(null)
            }}
            className="w-full text-center text-2xl py-3 bg-[#0a0e1a] border-4 border-[#2a3558] focus:border-[#5ef0ff] outline-none"
            placeholder="Your nickname"
          />
          {error && (
            <p className="text-[#ff4757] mt-2" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full py-3 bg-[#c49bff] text-[#0a0e1a] font-pixel text-xs pixel-border disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save score'}
          </button>
        </div>
      ) : (
        <p className="text-[#2ed573] text-xl mb-6" role="status">
          Score saved to leaderboard!
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="py-3 bg-[#b8ff5a] text-[#0a0e1a] font-pixel text-xs pixel-border"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onLeaderboard}
          className="py-3 bg-[#2a3558] text-[#5ef0ff] font-pixel text-xs pixel-border"
        >
          View leaderboard
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="py-3 text-[#8a9bb8] hover:text-white"
        >
          Main menu
        </button>
      </div>
    </div>
  )
}
