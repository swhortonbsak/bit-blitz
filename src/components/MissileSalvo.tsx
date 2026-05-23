import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

export interface MissileStrikeTarget {
  targetX: number
  targetY: number
}

interface MissileSalvoProps {
  target: MissileStrikeTarget
  onImpact: () => void
}

/** Retro missiles launched from the defense line toward the invader */
export function MissileSalvo({ target, onImpact }: MissileSalvoProps) {
  const missiles = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => ({
        id: i,
        startX: 12 + i * 18 + (i % 2 === 0 ? 0 : 4),
        delay: i * 0.07,
      })),
    [],
  )

  const flightMs = 620
  const impactMs = flightMs + 80

  const onImpactRef = useRef(onImpact)
  onImpactRef.current = onImpact

  useEffect(() => {
    const impactTimer = window.setTimeout(() => onImpactRef.current(), impactMs)
    return () => clearTimeout(impactTimer)
  }, [impactMs])

  return (
    <div className="missile-layer absolute inset-0 z-[35] pointer-events-none overflow-hidden">
      {missiles.map((m) => (
        <div
          key={m.id}
          className="missile-flight"
          style={
            {
              '--start-x': `${m.startX}%`,
              '--end-x': `${target.targetX}%`,
              '--end-y': `${target.targetY}%`,
              '--delay': `${m.delay}s`,
              '--duration': `${flightMs / 1000}s`,
            } as CSSProperties
          }
        >
          <PixelMissile />
        </div>
      ))}
    </div>
  )
}

function PixelMissile() {
  return (
    <svg
      width="14"
      height="22"
      viewBox="0 0 6 10"
      shapeRendering="crispEdges"
      className="missile-sprite"
      aria-hidden
    >
      <rect x="2" y="0" width="2" height="2" fill="#dfe6e9" stroke="#1a1a1a" />
      <rect x="1" y="2" width="4" height="5" fill="#b2bec3" stroke="#1a1a1a" />
      <rect x="2" y="7" width="2" height="1" fill="#636e72" />
      <rect x="1" y="8" width="1" height="2" fill="#f39c12" />
      <rect x="4" y="8" width="1" height="2" fill="#f39c12" />
      <rect x="2" y="9" width="2" height="1" fill="#e74c3c" />
    </svg>
  )
}
