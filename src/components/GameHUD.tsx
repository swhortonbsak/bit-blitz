import type { GameStats, Question, Threat } from '../game/types'
import { MODE_LABELS } from '../game/types'
import type { ConversionMode, Difficulty } from '../game/types'
import { SoundToggle } from './SoundToggle'

interface GameHUDProps {
  stats: GameStats
  lives: number
  sessionTimeLeft: number
  mode: ConversionMode
  difficulty: Difficulty
  lastScoreDelta: number | null
  threat: Threat | null
  question?: Question
}

export function GameHUD({
  stats,
  lives,
  sessionTimeLeft,
  mode,
  difficulty,
  lastScoreDelta,
  threat,
  question,
}: GameHUDProps) {
  const fallPct = threat ? Math.round(threat.progress * 100) : 0
  const isPractice = difficulty === 'practice'

  return (
    <header className="cabinet-header flex flex-wrap items-center justify-between gap-2 px-2 py-2 bg-[#3d2914] border-b-4 border-[#5c3d2e] shrink-0 relative">
      <div className="flex items-center gap-3 sm:gap-6">
        <div>
          <span className="font-pixel text-[#ffe566] text-[8px] sm:text-[10px] block">SCORE</span>
          <span className="font-pixel text-[#fff] text-sm sm:text-base relative">
            {stats.score}
            {lastScoreDelta !== null && (
              <span className="absolute -right-8 top-0 font-pixel text-[#55efc4] text-[8px] score-pop">
                +{lastScoreDelta}
              </span>
            )}
          </span>
        </div>
        <div>
          <span className="font-pixel text-[#ffccaa] text-[8px] block">STREAK</span>
          <span className="font-pixel text-[#ffe566] text-xs">×{stats.streak}</span>
        </div>
        <div aria-label={isPractice ? 'Practice mode' : `${lives} lives`}>
          {isPractice ? (
            <span className="font-pixel text-[#2ed573] text-[8px] sm:text-[9px] uppercase tracking-wide">
              Practice
            </span>
          ) : (
            <>
              <span className="font-pixel text-[#ffccaa] text-[8px] block">LIVES</span>
              <span className="text-lg">{['♥', '♥', '♥'].map((h, i) => (
                <span key={i} className={i < lives ? 'text-[#d63031]' : 'text-[#636e72]'}>
                  {h}
                </span>
              ))}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right hidden sm:block">
          <span className="font-pixel text-[#a0c4d4] text-[6px]">
            {MODE_LABELS[mode]} · {difficulty}
          </span>
          {!isPractice && (
            <span className="font-pixel text-[#ff7675] text-[8px] block">
              FALL {fallPct}%
            </span>
          )}
          <span className="font-pixel text-[#74b9ff] text-[8px]">
            {Math.floor(sessionTimeLeft / 60)}:
            {String(Math.ceil(sessionTimeLeft % 60)).padStart(2, '0')}
          </span>
        </div>
        <SoundToggle compact />
      </div>

      {question && (
        <p className="w-full text-center font-pixel text-[#74b9ff] text-[7px] sm:text-[8px] truncate sm:hidden">
          {question.sourceLabel}: {question.sourceValue} → {question.targetLabel}
        </p>
      )}
      {!isPractice && (
        <p className="w-full text-center font-pixel text-[#ffe566] text-[7px] sm:hidden">
          FALL {fallPct}%
        </p>
      )}
    </header>
  )
}
