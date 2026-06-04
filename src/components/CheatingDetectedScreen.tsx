interface CheatingDetectedScreenProps {
  onPlayAgain: () => void
  onMenu: () => void
}

export function CheatingDetectedScreen({ onPlayAgain, onMenu }: CheatingDetectedScreenProps) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 text-center">
      <h2 className="font-pixel text-[#ff4757] text-xl sm:text-2xl mb-4">Cheating Detected</h2>

      <div className="mb-8 text-left bg-[#12182b] p-4 pixel-border">
        <p className="text-[#dfe6e9] text-lg sm:text-xl leading-relaxed mb-3">
          Unauthorized automation or game tampering was detected. This session cannot
          continue fairly.
        </p>
        <p className="text-[#8a9bb8] text-lg sm:text-xl leading-relaxed">
          This session&apos;s score will not be saved to the leaderboard.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="py-3 bg-[#b8ff5a] text-[#0a0e1a] font-pixel text-xs pixel-border"
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="py-3 bg-[#2a3558] text-[#5ef0ff] font-pixel text-xs pixel-border"
        >
          Main menu
        </button>
      </div>
    </div>
  )
}
