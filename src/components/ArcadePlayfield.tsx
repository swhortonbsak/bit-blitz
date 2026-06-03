import { ExplosionEffect } from './ExplosionEffect'
import { MissileSalvo, type MissileStrikeTarget } from './MissileSalvo'
import { QuestionBanner } from './QuestionBanner'
import { RetroFallingSprite } from './RetroFallingSprite'
import type { Question, Threat } from '../game/types'

export type MissileStrikeState = MissileStrikeTarget & { key: number }

export type ExplosionFxState = MissileStrikeTarget & { key: number }

interface ArcadePlayfieldProps {
  threats: Threat[]
  question: Question
  phase: string
  highScore: number
  missileStrike: MissileStrikeState | null
  explosionFx: ExplosionFxState | null
  onMissileImpact: () => void
}

const INVADER_SCALE = 1.5

function formatInvaderLabel(value: string, type: Question['sourceType']): string {
  if (type === 'binary') {
    const bits = value.replace(/\s/g, '').padStart(8, '0')
    return `${bits.slice(0, 4)} ${bits.slice(4)}`
  }
  return value
}

export function getThreatPosition(threat: Threat): MissileStrikeTarget {
  return {
    targetX: threat.x,
    targetY: 22 + threat.progress * 62,
  }
}

export function ArcadePlayfield({
  threats,
  question,
  phase,
  highScore,
  missileStrike,
  explosionFx,
  onMissileImpact,
}: ArcadePlayfieldProps) {
  const hideInvaders = !!explosionFx

  return (
    <div className="arcade-sky playfield-main relative flex-1 min-h-[52vh] sm:min-h-[58vh] overflow-hidden">
      <div className="starfield" aria-hidden />
      <div className="mountain-line" aria-hidden />

      <div className="absolute top-0 left-0 right-0 z-20 flex justify-center px-2 py-1 bg-[#0d1b2a]/80">
        <span className="font-pixel text-[#ffe566] text-[7px] sm:text-[8px] tracking-wide">
          HIGHSCORE {highScore}
        </span>
      </div>

      <QuestionBanner question={question} />

      {missileStrike && (
        <MissileSalvo
          key={missileStrike.key}
          target={missileStrike}
          onImpact={onMissileImpact}
        />
      )}

      {explosionFx && (
        <ExplosionEffect key={explosionFx.key} x={explosionFx.targetX} y={explosionFx.targetY} />
      )}

      {threats.map((threat) => {
        const showInvader =
          !hideInvaders && (phase === 'playing' || threat.exploding)
        if (!showInvader) return null
        const invaderLabel = formatInvaderLabel(threat.displayValue, threat.question.sourceType)
        const progress = threat.progress
        return (
          <div
            key={threat.id}
            className="absolute z-30 flex flex-col items-center invader-slot enemy-drop"
            style={{
              left: `${threat.x}%`,
              top: `${22 + progress * 62}%`,
              transform: 'translate(-50%, 0)',
            }}
          >
            <div
              className="invader-value-tag mb-1 px-3 py-1 bg-[#1a1a1a] border-3 border-[#ffe566] shadow-[3px_3px_0_#000]"
              aria-hidden
            >
              <span className="font-pixel text-sm sm:text-base text-[#ffe566] tracking-widest whitespace-nowrap">
                {invaderLabel}
              </span>
            </div>
            <RetroFallingSprite
              type={threat.displayType}
              value={threat.displayValue}
              scale={INVADER_SCALE}
            />
          </div>
        )
      })}

      <div className="launchpad-rail absolute bottom-0 left-0 right-0 z-20" aria-hidden>
        <div className="h-1.5 bg-[#636e72] border-t-4 border-[#b2bec3]" />
      </div>

      {threats.length === 0 && phase === 'playing' && !missileStrike && !explosionFx && (
        <p className="absolute inset-0 flex items-center justify-center font-pixel text-[#74b9ff] text-xs z-10">
          INCOMING…
        </p>
      )}
    </div>
  )
}
