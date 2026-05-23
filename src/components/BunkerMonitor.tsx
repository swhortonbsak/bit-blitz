import { binary8ToDenary, binary8ToHex } from '../utils/conversions'
import { bitsToString } from '../game/gameEngine'

interface BunkerMonitorProps {
  bits: boolean[]
}

export function BunkerMonitor({ bits }: BunkerMonitorProps) {
  const binary = bitsToString(bits)
  const denary = binary8ToDenary(binary)
  const hex = binary8ToHex(binary)

  return (
    <div className="bunker-room flex items-center justify-center gap-2 px-1 py-1">
      <svg width="28" height="34" viewBox="0 0 20 24" shapeRendering="crispEdges" className="shrink-0" aria-hidden>
        <rect x="6" y="4" width="8" height="8" fill="#ffccaa" stroke="#1a1a1a" />
        <rect x="5" y="2" width="10" height="3" fill="#d63031" stroke="#1a1a1a" />
        <rect x="4" y="12" width="12" height="10" fill="#d63031" stroke="#1a1a1a" />
      </svg>

      <div className="monitor-crt flex-1 max-w-[200px]">
        <div className="monitor-bezel bg-[#2d3436] p-0.5 border-2 border-[#636e72]">
          <div className="monitor-screen bg-[#0a1628] px-2 py-1 border border-[#1a1a1a] text-center">
            <p className="font-pixel text-[5px] text-[#74b9ff]">{binary}</p>
            <p className="font-pixel text-sm text-[#ffe566] tracking-widest">{hex}</p>
            <p className="font-pixel text-[6px] text-[#55efc4]">= {denary}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
