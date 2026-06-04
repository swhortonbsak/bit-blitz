interface PauseOverlayProps {
  onResume: () => void
}

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d1b2a]/90 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <h2
        id="pause-title"
        className="font-pixel text-[#ffe566] text-sm sm:text-base mb-2 tracking-wider"
      >
        PAUSED
      </h2>
      <p className="font-pixel text-[#a0c4d4] text-[7px] sm:text-[8px] mb-6 text-center max-w-xs leading-relaxed">
        Invaders frozen. No score penalty.
      </p>
      <button
        type="button"
        onClick={onResume}
        className="fire-btn px-10 py-3 font-pixel text-[10px] sm:text-xs"
      >
        ▶ RESUME
      </button>
    </div>
  )
}
