import type { Question } from '../game/types'

function formatSourceDisplay(question: Question): string {
  const v = question.sourceValue
  if (question.sourceType === 'binary') {
    const bits = v.replace(/\s/g, '').padStart(8, '0')
    return `${bits.slice(0, 4)} ${bits.slice(4)}`
  }
  return v
}

interface QuestionBannerProps {
  question: Question
}

/** Always-visible challenge — readable on projectors */
export function QuestionBanner({ question }: QuestionBannerProps) {
  const display = formatSourceDisplay(question)
  const systemColor =
    question.sourceType === 'binary'
      ? 'text-[#74b9ff]'
      : question.sourceType === 'hex'
        ? 'text-[#ff7675]'
        : 'text-[#ffe566]'

  return (
    <div
      className="question-banner absolute top-9 left-2 right-2 z-[25] mx-auto max-w-md"
      role="region"
      aria-label={`Convert ${question.sourceLabel} ${question.sourceValue} to ${question.targetLabel}`}
    >
      <div className="bg-[#0a0e1a]/92 border-4 border-[#ffe566] px-3 py-2 sm:py-3 shadow-[4px_4px_0_#000]">
        <p className="font-pixel text-[7px] sm:text-[8px] text-[#dfe6e9] text-center tracking-wider mb-1">
          CONVERT THIS {question.sourceLabel.toUpperCase()}
        </p>
        <p
          className={`font-pixel text-center tracking-[0.15em] leading-tight ${systemColor} text-lg sm:text-2xl md:text-3xl break-all`}
          aria-live="polite"
        >
          {display}
        </p>
        <p className="font-pixel text-[7px] sm:text-[8px] text-[#55efc4] text-center mt-1.5">
          ▼ BUILD {question.targetLabel.toUpperCase()} · FIRE ▼
        </p>
      </div>
    </div>
  )
}
