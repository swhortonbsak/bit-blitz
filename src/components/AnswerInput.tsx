import type { NumberSystem } from '../game/types'
import { sanitizeDenaryInput, sanitizeHexInput } from '../utils/validation'

interface AnswerInputProps {
  targetType: Exclude<NumberSystem, 'binary'>
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
}

export function AnswerInput({ targetType, value, onChange, disabled, id = 'answer-input' }: AnswerInputProps) {
  const handleChange = (raw: string) => {
    if (targetType === 'hex') onChange(sanitizeHexInput(raw))
    else onChange(sanitizeDenaryInput(raw))
  }

  const placeholder = targetType === 'hex' ? '00–FF' : '0–255'
  const maxLength = targetType === 'hex' ? 2 : 3
  const label = targetType === 'hex' ? 'Hexadecimal answer (2 digits)' : 'Denary answer (0–255)'

  return (
    <div className="w-full max-w-md mx-auto">
      <label htmlFor={id} className="block text-center text-[#8a9bb8] text-xl mb-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={targetType === 'hex' ? 'text' : 'numeric'}
        autoComplete="off"
        spellCheck={false}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full text-center font-pixel text-2xl sm:text-4xl py-4 bg-[#0a0e1a] text-[#ffe566] border-4 border-[#2a3558] focus:border-[#5ef0ff] focus:outline-none uppercase tracking-widest"
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="mt-2 text-center text-[#8a9bb8] text-lg">
        Enter to submit · Backspace to clear
      </p>
    </div>
  )
}
