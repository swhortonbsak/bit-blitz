import type { ConversionMode, Difficulty } from '../game/types'
import { MODE_LABELS } from '../game/types'

interface ModeSelectorProps {
  mode: ConversionMode
  difficulty: Difficulty
  timerEnabled: boolean
  onModeChange: (m: ConversionMode) => void
  onDifficultyChange: (d: Difficulty) => void
  onTimerToggle: () => void
  /** Tighter spacing for the start screen viewport layout */
  compact?: boolean
  /** Hide difficulty/timer helper lines to save vertical space on the title screen */
  hideDescriptions?: boolean
  className?: string
}

const MODES: ConversionMode[] = [
  'binary-to-denary',
  'denary-to-binary',
  'binary-to-hex',
  'hex-to-binary',
  'denary-to-hex',
  'hex-to-denary',
  'mixed',
]

const DIFFICULTIES: Difficulty[] = ['practice', 'easy', 'medium', 'hard', 'insane']

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  practice: 'Practice',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  insane: '☠ INSANE',
}

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  practice: 'Invaders freeze · 10pts per answer · no lives lost',
  easy: 'Slow fall + place values · hints on',
  medium: 'Medium speed · no place values · hints on',
  hard: 'Fast fall · no hints · 1.5× score multiplier',
  insane: 'TWO bugs at medium speed · no hints · 2× score · very hard!',
}

export function ModeSelector({
  mode,
  difficulty,
  timerEnabled,
  onModeChange,
  onDifficultyChange,
  onTimerToggle,
  compact = false,
  hideDescriptions = false,
  className = '',
}: ModeSelectorProps) {
  const sectionGap = compact ? 'space-y-2' : 'space-y-6'
  const legendMb = compact ? 'mb-1' : 'mb-3'
  const descMt = compact ? 'mt-1' : 'mt-2'
  const modePad = compact ? 'p-2 gap-1.5' : 'p-3 gap-2'
  const modeText = compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
  const diffPad = compact ? 'px-3 py-1.5' : 'px-6 py-3'
  const diffGap = compact ? 'gap-1.5' : 'gap-3'

  return (
    <div className={`${sectionGap} max-w-2xl mx-auto w-full ${className}`.trim()}>
      <fieldset>
        <legend
          className={`font-pixel text-[#5ef0ff] text-xs sm:text-sm ${legendMb} text-center w-full`}
        >
          Conversion mode
        </legend>
        <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {MODES.map((m) => (
            <label
              key={m}
              className={`
                flex items-center ${modePad} cursor-pointer ${modeText} pixel-border
                ${mode === m ? 'bg-[#2a3558] ring-2 ring-[#5ef0ff]' : 'bg-[#12182b] hover:bg-[#1a2238]'}
              `}
            >
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => onModeChange(m)}
                className="accent-[#5ef0ff] w-5 h-5"
              />
              {MODE_LABELS[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend
          className={`font-pixel text-[#ff6eb4] text-xs sm:text-sm ${legendMb} text-center w-full`}
        >
          Difficulty
        </legend>
        <div className={`flex flex-wrap justify-center ${diffGap}`}>
          {DIFFICULTIES.map((d) => {
            const isPractice = d === 'practice'
            const isInsane = d === 'insane'
            const isSelected = difficulty === d
            let colorClasses: string
            if (isPractice) {
              colorClasses = isSelected
                ? 'bg-[#2ed573] text-[#0a0e1a]'
                : 'bg-[#12182b] text-[#2ed573]'
            } else if (isInsane) {
              colorClasses = isSelected
                ? 'bg-[#ff2d55] text-[#fff] ring-2 ring-[#ff2d55]'
                : 'bg-[#12182b] text-[#ff2d55] border-[#ff2d55]'
            } else {
              colorClasses = isSelected
                ? 'bg-[#ff6eb4] text-[#0a0e1a]'
                : 'bg-[#12182b] text-[#ff6eb4]'
            }
            return (
              <label
                key={d}
                className={`
                  ${diffPad} cursor-pointer font-pixel text-[10px] sm:text-xs uppercase pixel-border
                  ${colorClasses}
                `}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={d}
                  checked={isSelected}
                  onChange={() => onDifficultyChange(d)}
                  className="sr-only"
                />
                {DIFFICULTY_LABELS[d]}
              </label>
            )
          })}
        </div>
        {!hideDescriptions && (
          <p className={`text-center text-[#8a9bb8] text-lg ${descMt}`}>
            {DIFFICULTY_DESCRIPTIONS[difficulty]}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend
          className={`font-pixel text-[#74b9ff] text-xs sm:text-sm ${legendMb} text-center w-full`}
        >
          Timer
        </legend>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onTimerToggle}
            className={`
              ${diffPad} cursor-pointer font-pixel text-[10px] sm:text-xs pixel-border
              ${timerEnabled
                ? 'bg-[#74b9ff] text-[#0a0e1a]'
                : 'bg-[#12182b] text-[#74b9ff]'
              }
            `}
          >
            {timerEnabled ? '⏱ 5-MIN TIMER ON' : '∞ TIMER OFF'}
          </button>
        </div>
        {!hideDescriptions && (
          <p className={`text-center text-[#8a9bb8] text-lg ${descMt}`}>
            {timerEnabled
              ? 'Timer on — 5-minute session, score saved to leaderboard'
              : 'Untimed — play forever, score still saved to leaderboard'}
          </p>
        )}
      </fieldset>
    </div>
  )
}
