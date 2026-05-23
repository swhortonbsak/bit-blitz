import { HexBugInvader } from './HexBugInvader'

export type SpriteType = 'binary' | 'denary' | 'hex'

interface RetroFallingSpriteProps {
  type: SpriteType
  value: string
  scale?: number
}

/** Unified retro falling invader — bug, meteor, or tape-drone per number system */
export function RetroFallingSprite({ type, value, scale = 1.6 }: RetroFallingSpriteProps) {
  if (type === 'hex') {
    return <HexBugInvader hexValue={value} scale={scale} />
  }
  if (type === 'denary') {
    return <DenaryMeteor value={value} scale={scale} />
  }
  return <BinaryTapeDrone value={value} scale={scale} />
}

/** Green/teal meteor with denary on a CRT face */
function DenaryMeteor({ value, scale }: { value: string; scale: number }) {
  const s = scale
  return (
    <svg
      width={56 * s}
      height={64 * s}
      viewBox="0 0 28 32"
      shapeRendering="crispEdges"
      className="drop-shadow-[4px_6px_0_#0009]"
      aria-hidden
    >
      {/* Flame trail */}
      <rect x="11" y="26" width="6" height="4" fill="#f39c12" />
      <rect x="12" y="28" width="4" height="3" fill="#e74c3c" />
      {/* Rocky body */}
      <rect x="6" y="10" width="16" height="16" fill="#636e72" stroke="#1a1a1a" />
      <rect x="8" y="12" width="12" height="4" fill="#95a5a6" />
      <rect x="4" y="14" width="4" height="8" fill="#7f8c8d" stroke="#1a1a1a" />
      <rect x="20" y="14" width="4" height="8" fill="#7f8c8d" stroke="#1a1a1a" />
      {/* Face */}
      <rect x="8" y="16" width="12" height="8" fill="#1a1a1a" stroke="#ffe566" />
      <text x="14" y="22" textAnchor="middle" fill="#ffe566" fontSize="5" fontFamily="monospace" fontWeight="bold">
        {value.slice(0, 3)}
      </text>
      {/* Crater dots */}
      <rect x="7" y="11" width="2" height="2" fill="#2d3436" />
      <rect x="18" y="13" width="2" height="2" fill="#2d3436" />
    </svg>
  )
}

/** Purple tape-drone / UFO carrying an 8-bit display (not a flat box) */
function BinaryTapeDrone({ value, scale }: { value: string; scale: number }) {
  const s = scale
  const bits = value.padStart(8, '0').slice(0, 8)
  const high = bits.slice(0, 4)
  const low = bits.slice(4)

  return (
    <svg
      width={80 * s}
      height={72 * s}
      viewBox="0 0 40 36"
      shapeRendering="crispEdges"
      className="drop-shadow-[4px_6px_0_#0009]"
      aria-hidden
    >
      {/* Antenna */}
      <rect x="19" y="0" width="2" height="4" fill="#a29bfe" stroke="#1a1a1a" />
      <rect x="17" y="0" width="6" height="2" fill="#ffe566" />
      {/* Dome */}
      <rect x="12" y="4" width="16" height="8" fill="#6c5ce7" stroke="#1a1a1a" />
      <rect x="14" y="6" width="12" height="4" fill="#a29bfe" />
      {/* Side pods */}
      <rect x="4" y="10" width="6" height="6" fill="#5f27cd" stroke="#1a1a1a" />
      <rect x="30" y="10" width="6" height="6" fill="#5f27cd" stroke="#1a1a1a" />
      {/* Main chassis */}
      <rect x="8" y="12" width="24" height="14" fill="#341f97" stroke="#1a1a1a" strokeWidth="1" />
      {/* Tape reels */}
      <rect x="10" y="14" width="5" height="5" fill="#2d3436" stroke="#dfe6e9" />
      <rect x="25" y="14" width="5" height="5" fill="#2d3436" stroke="#dfe6e9" />
      <rect x="11" y="15" width="3" height="3" fill="#636e72" />
      <rect x="26" y="15" width="3" height="3" fill="#636e72" />
      {/* LCD — nibbles */}
      <rect x="14" y="20" width="12" height="6" fill="#0a0e1a" stroke="#74b9ff" />
      {[...high, ...low].map((b, i) => (
        <rect
          key={i}
          x={15 + (i % 4) * 3}
          y={21 + Math.floor(i / 4) * 3}
          width="2"
          height="2"
          fill={b === '1' ? '#ffe566' : '#2d3436'}
        />
      ))}
      {/* Thrusters */}
      <rect x="12" y="26" width="4" height="4" fill="#f39c12" />
      <rect x="24" y="26" width="4" height="4" fill="#f39c12" />
      <rect x="13" y="28" width="2" height="3" fill="#e74c3c" />
      <rect x="25" y="28" width="2" height="3" fill="#e74c3c" />
      {/* Legs */}
      <rect x="10" y="30" width="2" height="4" fill="#636e72" />
      <rect x="28" y="30" width="2" height="4" fill="#636e72" />
    </svg>
  )
}
