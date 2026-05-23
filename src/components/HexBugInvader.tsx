/** Pixel-art hex bug invader inspired by classic arcade enemies — original art */

interface HexBugInvaderProps {
  hexValue: string
  scale?: number
}

export function HexBugInvader({ hexValue, scale = 1 }: HexBugInvaderProps) {
  const display = hexValue.padStart(2, '0').slice(0, 2).toUpperCase()

  return (
    <svg
      width={64 * scale}
      height={72 * scale}
      viewBox="0 0 32 36"
      shapeRendering="crispEdges"
      className="hex-bug drop-shadow-[4px_4px_0_#0008]"
      aria-hidden
    >
      {/* Wings */}
      <rect x="2" y="8" width="6" height="4" fill="#e8e8e8" stroke="#1a1a1a" strokeWidth="1" />
      <rect x="24" y="8" width="6" height="4" fill="#e8e8e8" stroke="#1a1a1a" strokeWidth="1" />
      {/* Body */}
      <rect x="8" y="6" width="16" height="18" fill="#d63031" stroke="#1a1a1a" strokeWidth="1" />
      <rect x="10" y="8" width="12" height="4" fill="#ff6b6b" />
      {/* Legs */}
      <rect x="6" y="22" width="2" height="8" fill="#636e72" />
      <rect x="11" y="24" width="2" height="6" fill="#636e72" />
      <rect x="16" y="24" width="2" height="6" fill="#636e72" />
      <rect x="21" y="22" width="2" height="8" fill="#636e72" />
      {/* Face screen */}
      <rect x="10" y="12" width="12" height="8" fill="#1a1a1a" stroke="#ffe566" strokeWidth="1" />
      <text
        x="16"
        y="18"
        textAnchor="middle"
        fill="#ffe566"
        fontSize="6"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {display}
      </text>
      {/* Antenna */}
      <rect x="15" y="2" width="2" height="4" fill="#d63031" />
      <rect x="13" y="0" width="6" height="2" fill="#ffe566" />
    </svg>
  )
}
