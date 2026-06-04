import { BitBot } from './BitBot'
import { ModeSelector } from './ModeSelector'
import { SoundToggle } from './SoundToggle'
import type { ConversionMode, Difficulty } from '../game/types'

interface StartScreenProps {
  mode: ConversionMode
  difficulty: Difficulty
  timerEnabled: boolean
  highScore: number
  onModeChange: (m: ConversionMode) => void
  onDifficultyChange: (d: Difficulty) => void
  onTimerToggle: () => void
  onPlay: () => void
  onLeaderboard: () => void
}

const QUICK_RULES = [
  { icon: '🐛', label: 'Bug', hint: 'number to convert' },
  { icon: '⬜', label: 'Bits', hint: 'keys 1–8' },
  { icon: '🖥️', label: 'Monitor', hint: 'hex + denary' },
  { icon: '🚀', label: 'FIRE', hint: 'launch rockets' },
] as const

export function StartScreen({
  mode,
  difficulty,
  timerEnabled,
  highScore,
  onModeChange,
  onDifficultyChange,
  onTimerToggle,
  onPlay,
  onLeaderboard,
}: StartScreenProps) {
  return (
    <div className="title-screen h-full max-h-full flex flex-col gap-1.5 overflow-hidden">
      <div className="flex justify-end shrink-0">
        <SoundToggle />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="title-screen-fit h-full grid gap-2.5 items-start
            grid-cols-1 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)]"
        >
          <div className="title-panel p-2.5 sm:p-3 flex flex-col gap-2.5 min-h-0">
            <div className="flex gap-2.5 sm:gap-3 items-center">
              <div className="bit-bot-float shrink-0">
                <BitBot className="w-14 h-14 sm:w-16 sm:h-16" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-pixel text-[#ffe566] text-[10px] sm:text-xs mb-0.5">
                  HIGHSCORE {highScore}
                </p>
                <h1 className="font-pixel text-[#74b9ff] text-base sm:text-xl leading-snug mb-0.5 drop-shadow-[3px_3px_0_#1a1a1a]">
                  BIT BLITZ
                </h1>
                <p className="text-[#ff7675] font-bold font-pixel text-[10px] sm:text-xs leading-snug">
                  Attack of the Base-16 Invaders
                </p>
              </div>
            </div>

            <p className="hidden md:block text-[#dfe6e9] text-sm leading-snug text-left">
              Flip your 8 defence bits, read the bunker monitor, and FIRE before the hex bugs land!
            </p>

            <div className="border-t border-[#2a3558]/80 pt-2">
              <h2 className="font-pixel text-[#ffe566] text-[10px] mb-1.5">HOW TO PLAY</h2>
              <ul className="grid grid-cols-2 gap-1.5 list-none">
                {QUICK_RULES.map(({ icon, label, hint }) => (
                  <li
                    key={label}
                    className="start-rule flex items-center gap-1.5 px-2 py-1.5 min-w-0"
                  >
                    <span className="text-sm shrink-0" aria-hidden>
                      {icon}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block font-pixel text-[#ffe566] text-[9px] sm:text-[10px]">
                        {label}
                      </span>
                      <span className="block text-[#b2bec3] text-[10px] sm:text-xs truncate">
                        {hint}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-h-0 w-full">
            <ModeSelector
              compact
              hideDescriptions
              className="max-w-none"
              mode={mode}
              difficulty={difficulty}
              timerEnabled={timerEnabled}
              onModeChange={onModeChange}
              onDifficultyChange={onDifficultyChange}
              onTimerToggle={onTimerToggle}
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col sm:flex-row gap-2 justify-center pt-0.5">
        <button type="button" onClick={onPlay} className="fire-btn px-8 py-2.5 sm:py-3 font-pixel text-xs">
          INSERT COIN ▶
        </button>
        <button
          type="button"
          onClick={onLeaderboard}
          className="px-6 py-2.5 sm:py-3 bg-[#2d3436] text-[#74b9ff] font-pixel text-[10px] border-4 border-[#636e72] hover:bg-[#636e72]"
        >
          HISCORES
        </button>
      </div>
    </div>
  )
}
