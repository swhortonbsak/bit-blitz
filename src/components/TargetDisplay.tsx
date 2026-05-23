import type { Question } from '../game/types'

interface TargetDisplayProps {
  question: Question
}

export function TargetDisplay({ question }: TargetDisplayProps) {
  const systemColors: Record<string, string> = {
    binary: 'text-[#5ef0ff]',
    denary: 'text-[#ffe566]',
    hex: 'text-[#ff6eb4]',
  }

  return (
    <div className="text-center py-4 sm:py-6">
      <p className="text-[#8a9bb8] text-xl sm:text-2xl uppercase tracking-widest mb-2">
        Target {question.sourceLabel}
      </p>
      <div
        className={`font-pixel text-2xl sm:text-4xl md:text-5xl break-all px-4 ${systemColors[question.sourceType]}`}
        aria-live="polite"
      >
        {question.sourceType === 'binary' && (
          <span className="tracking-widest">{question.sourceValue}</span>
        )}
        {question.sourceType === 'denary' && <span>{question.sourceValue}</span>}
        {question.sourceType === 'hex' && <span>{question.sourceValue}</span>}
      </div>
      <p className="mt-3 text-[#c49bff] text-xl sm:text-2xl">
        Build your answer in <strong>{question.targetLabel}</strong>
      </p>
    </div>
  )
}
