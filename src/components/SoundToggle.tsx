import { useSound } from '../audio/SoundContext'

interface SoundToggleProps {
  className?: string
  compact?: boolean
}

export function SoundToggle({ className = '', compact }: SoundToggleProps) {
  const { enabled, toggle, unlock, play } = useSound()

  return (
    <button
      type="button"
      onClick={() => {
        unlock()
        const on = toggle()
        if (on) play('menu')
      }}
      className={`font-pixel text-[8px] sm:text-[10px] px-3 py-2 pixel-border transition-colors ${
        enabled
          ? 'bg-[#ffe566] text-[#3d2914] border-[#c9a227]'
          : 'bg-[#2a3558] text-[#8a9bb8] border-[#1a2238]'
      } ${className}`}
      aria-pressed={enabled}
      aria-label={enabled ? 'Sound on — click to mute' : 'Sound off — click to unmute'}
      title={enabled ? 'Mute sound' : 'Enable sound'}
    >
      {compact ? (enabled ? '🔊' : '🔇') : enabled ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
    </button>
  )
}
