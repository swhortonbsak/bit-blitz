import { useSound } from '../audio/SoundContext'
import { HEX_DIGITS } from '../game/types'
import { sanitizeDenaryInput, sanitizeHexInput } from '../utils/validation'

interface ArcadeKeypadProps {
  mode: 'denary' | 'hex'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ArcadeKeypad({ mode, value, onChange, disabled }: ArcadeKeypadProps) {
  const { play, unlock } = useSound()

  const keys =
    mode === 'hex'
      ? HEX_DIGITS
      : ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0']

  const append = (key: string) => {
    if (disabled) return
    unlock()
    play('flip')
    const next = mode === 'hex' ? sanitizeHexInput(value + key) : sanitizeDenaryInput(value + key)
    onChange(next)
  }

  const backspace = () => {
    if (disabled) return
    play('menu')
    onChange(value.slice(0, -1))
  }

  const display =
    mode === 'hex'
      ? value.padEnd(2, '·').split('')
      : [value || '—']

  return (
    <div className="w-full max-w-xs mx-auto compact-keypad">
      <div
        className="flex justify-center gap-1.5 mb-1.5 font-pixel text-xl text-[#ffe566] min-h-[2.25rem]"
        aria-live="polite"
        aria-label={`${mode} answer`}
      >
        {mode === 'hex' ? (
          display.map((c, i) => (
            <span
              key={i}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#0a0e1a] border-3 border-[#1a1a1a] text-lg"
            >
              {c === '·' ? ' ' : c}
            </span>
          ))
        ) : (
          <span className="px-4 py-1 bg-[#0a0e1a] border-3 border-[#1a1a1a] min-w-[80px] text-center text-lg">
            {value || '—'}
          </span>
        )}
      </div>

      <div
        className={`grid gap-1 ${mode === 'hex' ? 'grid-cols-4' : 'grid-cols-3'}`}
        role="group"
        aria-label={`${mode} keypad`}
      >
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => append(k)}
            className="py-1.5 sm:py-2 font-pixel text-[10px] sm:text-xs bg-[#dfe6e9] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[1px_2px_0_#636e72] hover:brightness-105 disabled:opacity-40 active:translate-y-px"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={backspace}
          className={`${mode === 'hex' ? 'col-span-4' : 'col-span-3'} py-1 font-pixel text-[8px] bg-[#5c3d2e] text-[#ffccaa] border-2 border-[#3d2914]`}
        >
          CLR
        </button>
      </div>
    </div>
  )
}
