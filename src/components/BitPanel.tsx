import { BINARY_PLACE_VALUES } from '../utils/conversions'

interface BitPanelProps {
  bits: boolean[]
  onFlip: (index: number) => void
  showPlaceValues: boolean
  disabled?: boolean
}

const KEY_MAP = ['1', '2', '3', '4', '5', '6', '7', '8'] as const
const QWERTY_MAP = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'] as const

export function getBitIndexFromKey(key: string): number | null {
  const lower = key.toLowerCase()
  const numIdx = KEY_MAP.indexOf(key as (typeof KEY_MAP)[number])
  if (numIdx >= 0) return numIdx
  const qwIdx = QWERTY_MAP.indexOf(lower as (typeof QWERTY_MAP)[number])
  if (qwIdx >= 0) return qwIdx
  return null
}

export function BitPanel({ bits, onFlip, showPlaceValues, disabled }: BitPanelProps) {
  return (
    <div className="w-full max-w-3xl mx-auto launchpad">
      {showPlaceValues && (
        <div
          className="grid grid-cols-8 gap-1 sm:gap-2 mb-1 text-center text-[#ffe566] text-sm sm:text-xl font-pixel"
          aria-hidden
        >
          {BINARY_PLACE_VALUES.map((v) => (
            <div key={v}>{v}</div>
          ))}
        </div>
      )}
      <div
        className="grid grid-cols-8 gap-0.5 sm:gap-1 p-1.5 sm:p-2 bg-[#636e72] border-4 border-[#b2bec3]"
        role="group"
        aria-label="8-bit binary defense"
      >
        {bits.map((on, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onFlip(i)}
            aria-label={`Bit ${i + 1}, ${on ? 1 : 0}`}
            aria-pressed={on}
            className={`
              bit-tile aspect-square min-h-9 sm:min-h-11 font-pixel text-lg sm:text-xl
              border-4 border-[#1a1a1a] shadow-[inset_0_-4px_0_#ccc]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffe566]
              ${on ? 'bg-[#f5f5f5] text-[#1a1a1a] bit-flip' : 'bg-[#dfe6e9] text-[#2d3436]'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-105 cursor-pointer active:translate-y-0.5'}
            `}
          >
            {on ? '1' : '0'}
          </button>
        ))}
      </div>
    </div>
  )
}
