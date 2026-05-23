import type { ConversionMode, Difficulty } from '../game/types'
import { MODE_LABELS } from '../game/types'

interface ModeSelectorProps {
  mode: ConversionMode
  difficulty: Difficulty
  onModeChange: (m: ConversionMode) => void
  onDifficultyChange: (d: Difficulty) => void
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

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function ModeSelector({
  mode,
  difficulty,
  onModeChange,
  onDifficultyChange,
}: ModeSelectorProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <fieldset>
        <legend className="font-pixel text-[#5ef0ff] text-xs sm:text-sm mb-3 text-center w-full">
          Conversion mode
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODES.map((m) => (
            <label
              key={m}
              className={`
                flex items-center gap-2 p-3 cursor-pointer text-lg sm:text-xl pixel-border
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
        <legend className="font-pixel text-[#ff6eb4] text-xs sm:text-sm mb-3 text-center w-full">
          Difficulty
        </legend>
        <div className="flex flex-wrap justify-center gap-3">
          {DIFFICULTIES.map((d) => (
            <label
              key={d}
              className={`
                px-6 py-3 cursor-pointer font-pixel text-[10px] sm:text-xs uppercase pixel-border
                ${difficulty === d ? 'bg-[#ff6eb4] text-[#0a0e1a]' : 'bg-[#12182b] text-[#ff6eb4]'}
              `}
            >
              <input
                type="radio"
                name="difficulty"
                value={d}
                checked={difficulty === d}
                onChange={() => onDifficultyChange(d)}
                className="sr-only"
              />
              {d}
            </label>
          ))}
        </div>
        <p className="text-center text-[#8a9bb8] text-lg mt-2">
          Easy: slow fall + place values · Hard: fast fall & 1.5× score
        </p>
      </fieldset>
    </div>
  )
}
