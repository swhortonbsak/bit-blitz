import { explainConversion } from '../utils/conversions'
import type { Question } from '../game/types'

interface HintPanelProps {
  question: Question
  visible: boolean
  onToggle: () => void
  hintsEnabled: boolean
}

export function HintPanel({ question, visible, onToggle, hintsEnabled }: HintPanelProps) {
  if (!hintsEnabled) return null

  const text = explainConversion(
    question.sourceType,
    question.sourceValue,
    question.targetType,
  )

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-2 py-1 bg-[#5c3d2e] text-[#c49bff] font-pixel text-[6px] sm:text-[8px] border-2 border-[#3d2914] hover:brightness-110"
      >
        {visible ? 'Hide hint (−25)' : 'Hint (−25)'}
      </button>
      {visible && (
        <div
          className="mt-1 p-2 bg-[#0a0e1a]/90 border border-[#c49bff] text-sm text-[#e8f0ff] leading-snug max-h-16 overflow-y-auto"
          role="note"
        >
          {text}
        </div>
      )}
    </div>
  )
}
