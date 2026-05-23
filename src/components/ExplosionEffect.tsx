import type { CSSProperties } from 'react'

interface ExplosionEffectProps {
  x: number
  y: number
}

/** Visible pixel burst + KABOOM — stays mounted until parent clears */
export function ExplosionEffect({ x, y }: ExplosionEffectProps) {
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

  return (
    <div
      className="explosion-fx absolute z-[45] pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      role="img"
      aria-label="Explosion"
    >
      <div className="explosion-flash" />
      <div className="explosion-core" />
      <div className="explosion-burst-visible">
        {angles.map((deg) => (
          <span
            key={deg}
            className="explosion-particle"
            style={{ '--angle': `${deg}deg` } as CSSProperties}
          />
        ))}
      </div>
      <p className="kaboom-label font-pixel text-[#ffe566] text-xl sm:text-3xl">KABOOM!</p>
    </div>
  )
}
