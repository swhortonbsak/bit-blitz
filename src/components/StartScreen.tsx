import { BitBot } from './BitBot'
import { ModeSelector } from './ModeSelector'
import { SoundToggle } from './SoundToggle'
import type { ConversionMode, Difficulty } from '../game/types'

interface StartScreenProps {
  mode: ConversionMode
  difficulty: Difficulty
  highScore: number
  onModeChange: (m: ConversionMode) => void
  onDifficultyChange: (d: Difficulty) => void
  onPlay: () => void
  onLeaderboard: () => void
}

export function StartScreen({
  mode,
  difficulty,
  highScore,
  onModeChange,
  onDifficultyChange,
  onPlay,
  onLeaderboard,
}: StartScreenProps) {
  return (
    <div className="title-screen max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex justify-end mb-2">
        <SoundToggle />
      </div>

      <div className="text-center mb-8 title-panel p-6 sm:p-8">
        <div className="flex justify-center mb-4 bit-bot-float">
          <BitBot className="w-20 h-20 sm:w-24 sm:h-24" />
        </div>
        <p className="font-pixel text-[#ffe566] text-[10px] sm:text-xs mb-2">
          HIGHSCORE {highScore}
        </p>
        <h1 className="font-pixel text-[#74b9ff] text-lg sm:text-2xl leading-relaxed mb-2 drop-shadow-[3px_3px_0_#1a1a1a]">
          BIT BLITZ
        </h1>
        <p className="text-[#ff7675] text-xl sm:text-2xl font-bold font-pixel text-xs sm:text-sm">
          Attack of the Base-16 Invaders
        </p>
        <p className="mt-4 text-[#dfe6e9] text-lg sm:text-xl max-w-md mx-auto leading-relaxed">
          Hex bugs descend from the stars. Flip your 8 defence bits, watch the bunker
          monitor, and FIRE rockets before they land!
        </p>
      </div>

      <div className="rules-panel p-4 sm:p-6 mb-8">
        <h2 className="font-pixel text-[#ffe566] text-[10px] mb-3">HOW TO PLAY</h2>
        <ul className="text-lg sm:text-xl space-y-2 text-[#dfe6e9] list-none">
          <li>🐛 Falling bug = the number to convert</li>
          <li>⬜ White tiles = your 8 bits (keys 1–8)</li>
          <li>🖥️ Bunker monitor = live hex + denary readout</li>
          <li>🚀 FIRE = launch rockets at the invader</li>
        </ul>
      </div>

      <ModeSelector
        mode={mode}
        difficulty={difficulty}
        onModeChange={onModeChange}
        onDifficultyChange={onDifficultyChange}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button type="button" onClick={onPlay} className="fire-btn px-10 py-4 font-pixel text-xs">
          INSERT COIN ▶
        </button>
        <button
          type="button"
          onClick={onLeaderboard}
          className="px-8 py-4 bg-[#2d3436] text-[#74b9ff] font-pixel text-[10px] border-4 border-[#636e72] hover:bg-[#636e72]"
        >
          HISCORES
        </button>
      </div>
    </div>
  )
}
