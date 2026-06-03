import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSound } from './audio/SoundContext'
import { ArcadeCabinet } from './components/ArcadeCabinet'
import { ArcadeKeypad } from './components/ArcadeKeypad'
import { BitPanel, getBitIndexFromKey } from './components/BitPanel'
import { BunkerMonitor } from './components/BunkerMonitor'
import { GameHUD } from './components/GameHUD'
import { GameOverScreen } from './components/GameOverScreen'
import { HintPanel } from './components/HintPanel'
import { Leaderboard } from './components/Leaderboard'
import { ArcadePlayfield, getThreatPosition } from './components/ArcadePlayfield'
import type { ExplosionFxState, MissileStrikeState } from './components/ArcadePlayfield'
import { StartScreen } from './components/StartScreen'
import {
  advanceRound,
  createInitialState,
  fireAnswer,
  flipBit,
  getCurrentAnswer,
  setTypedAnswer,
  tickGame,
  toggleHint,
  type GameState,
} from './game/gameEngine'
import type { ConversionMode, Difficulty } from './game/types'
import { DIFFICULTY_CONFIG, getAnswerStyle } from './game/types'
import { explainConversion } from './utils/conversions'
import { getHighScore, updateHighScore } from './utils/highScore'
import { validateAnswer } from './utils/validation'

type AppScreen = 'start' | 'playing' | 'leaderboard'

function App() {
  const { play, unlock } = useSound()
  const [screen, setScreen] = useState<AppScreen>('start')
  const [selectedMode, setSelectedMode] = useState<ConversionMode>('hex-to-binary')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy')
  const [game, setGame] = useState<GameState | null>(null)
  const [highScore, setHighScore] = useState(getHighScore)
  const [missileStrike, setMissileStrike] = useState<MissileStrikeState | null>(null)
  const [explosionFx, setExplosionFx] = useState<ExplosionFxState | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPhase = useRef<string | null>(null)
  const missilesBusy = useRef(false)
  const missileStrikeRef = useRef<MissileStrikeState | null>(null)
  missileStrikeRef.current = missileStrike

  const startGame = useCallback(() => {
    unlock()
    play('start')
    setGame(createInitialState({ mode: selectedMode, difficulty: selectedDifficulty }))
    setScreen('playing')
  }, [selectedMode, selectedDifficulty, play, unlock])

  useEffect(() => {
    if (!game) return
    if (game.config.difficulty === 'practice') return
    const hi = updateHighScore(game.stats.score)
    setHighScore(hi)
  }, [game?.stats.score])

  useEffect(() => {
    if (screen !== 'playing' || !game || game.phase !== 'playing') return

    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      setGame((g) => (g ? tickGame(g, delta) : g))
    }, 50)

    return () => clearInterval(id)
  }, [screen, game?.phase, game?.question.id])

  useEffect(() => {
    if (!game) return

    if (game.phase === 'feedback' && prevPhase.current === 'playing') {
      if (!game.feedbackCorrect) {
        if (game.feedbackMessage?.includes('Breach')) play('breach')
        else play('miss')
      }
    }
    if (game.phase === 'gameover' && prevPhase.current !== 'gameover') {
      play('gameOver')
    }
    prevPhase.current = game.phase
  }, [game?.phase, game?.feedbackCorrect, game?.feedbackMessage, play])

  useEffect(() => {
    if (!game || game.phase !== 'feedback') return

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => {
      setGame((g) => {
        if (!g) return g
        if (g.phase === 'gameover') return g
        return advanceRound(g)
      })
    }, game.feedbackCorrect ? 1600 : 2400)

    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [game?.phase, game?.question.id, game?.feedbackCorrect])

  const handleMissileImpact = useCallback(() => {
    const strike = missileStrikeRef.current
    if (!strike) return
    play('hit')
    setExplosionFx({
      targetX: strike.targetX,
      targetY: strike.targetY,
      key: Date.now(),
    })
    setMissileStrike(null)
    setGame((g) => {
      if (!g) return g
      return fireAnswer(g, true)
    })
    window.setTimeout(() => {
      setExplosionFx(null)
      missilesBusy.current = false
    }, 1400)
  }, [play])

  const handleFire = useCallback(() => {
    if (!game || game.phase !== 'playing' || missilesBusy.current) return
    const answer = getCurrentAnswer(game)
    const q = game.question

    if (q.targetType === 'binary' && answer.length !== 8) return
    if (q.targetType === 'denary' && !/^\d{1,3}$/.test(answer)) return
    if (q.targetType === 'hex' && answer.length !== 2) return

    play('fire')
    const correct = validateAnswer(q, answer)

    if (correct && game.threat) {
      missilesBusy.current = true
      setMissileStrike({ ...getThreatPosition(game.threat), key: Date.now() })
      return
    }

    setGame((g) => (g ? fireAnswer(g, correct) : g))
  }, [game, play])

  useEffect(() => {
    if (screen !== 'playing' || !game) return

    const onKey = (e: KeyboardEvent) => {
      if (game.phase === 'gameover') return

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (game.phase === 'playing') handleFire()
        return
      }

      if (game.phase !== 'playing') return

      const bitIdx = getBitIndexFromKey(e.key)
      if (bitIdx !== null && game.question.targetType === 'binary') {
        e.preventDefault()
        play('flip')
        setGame((g) => {
          if (!g) return g
          return { ...flipBit(g, bitIdx), feedbackMessage: null }
        })
      }

      if (e.key === 'Backspace' && game.question.targetType !== 'binary') {
        setGame((g) =>
          g ? setTypedAnswer(g, g.typedAnswer.slice(0, -1)) : g,
        )
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, game, handleFire, play])

  if (screen === 'leaderboard') {
    return (
      <AppShell>
        <Leaderboard onBack={() => setScreen('start')} />
      </AppShell>
    )
  }

  if (screen === 'start') {
    return (
      <AppShell>
        <StartScreen
          mode={selectedMode}
          difficulty={selectedDifficulty}
          highScore={highScore}
          onModeChange={setSelectedMode}
          onDifficultyChange={setSelectedDifficulty}
          onPlay={startGame}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      </AppShell>
    )
  }

  if (!game) return null

  if (game.phase === 'gameover') {
    return (
      <AppShell>
        <GameOverScreen
          config={game.config}
          stats={game.stats}
          onPlayAgain={startGame}
          onMenu={() => {
            setGame(null)
            setScreen('start')
          }}
          onLeaderboard={() => {
            setGame(null)
            setScreen('leaderboard')
          }}
        />
      </AppShell>
    )
  }

  const diff = DIFFICULTY_CONFIG[game.config.difficulty]
  const answerStyle = getAnswerStyle(game.question.targetType)

  return (
    <ArcadeCabinet shake={game.shake}>
      <GameHUD
        stats={game.stats}
        lives={game.lives}
        sessionTimeLeft={game.sessionTimeLeft}
        mode={game.config.mode}
        difficulty={game.config.difficulty}
        lastScoreDelta={game.lastScoreDelta}
        threat={game.threat}
        question={game.question}
      />

      <ArcadePlayfield
        threat={game.threat}
        question={game.question}
        phase={game.phase}
        highScore={highScore}
        missileStrike={missileStrike}
        explosionFx={explosionFx}
        onMissileImpact={handleMissileImpact}
      />

      <section className="launchpad-section controls-panel shrink-0 bg-[#636e72] border-y-4 border-[#b2bec3] px-2 py-1 max-h-[28vh] overflow-y-auto">

        <HintPanel
          question={game.question}
          visible={game.hintVisible}
          onToggle={() => setGame((g) => (g ? toggleHint(g) : g))}
          hintsEnabled={diff.hintsEnabled && game.phase === 'playing'}
        />

        {answerStyle === 'bits' ? (
          <BitPanel
            bits={game.bits}
            onFlip={(i) => {
              play('flip')
              setGame((g) => {
                if (!g) return g
                return { ...flipBit(g, i), feedbackMessage: null }
              })
            }}
            showPlaceValues={diff.showPlaceValues}
            disabled={game.phase !== 'playing'}
          />
        ) : (
          <ArcadeKeypad
            mode={answerStyle}
            value={game.typedAnswer}
            onChange={(v) => setGame((g) => (g ? setTypedAnswer(g, v) : g))}
            disabled={game.phase !== 'playing'}
          />
        )}

        {game.feedbackMessage && game.phase === 'playing' && (
          <p className="text-center font-pixel text-[8px] text-[#ffe566] mt-1" role="alert">
            {game.feedbackMessage}
          </p>
        )}
      </section>

      <section className="bunker-section shrink-0 bg-[#5c3d2e] border-t-4 border-[#3d2914] px-2 py-1.5">
        {answerStyle === 'bits' && <BunkerMonitor bits={game.bits} />}

        <div className="flex justify-center items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              unlock()
              handleFire()
            }}
            disabled={game.phase !== 'playing'}
            className="fire-btn px-8 py-2 font-pixel text-[10px] sm:text-xs disabled:opacity-40 flex-1 max-w-[200px]"
          >
            ▲ FIRE
          </button>
          <button
            type="button"
            onClick={() => {
              setGame(null)
              setScreen('start')
            }}
            className="px-2 py-2 font-pixel text-[7px] text-[#d4a574] hover:text-[#ffe566] shrink-0"
          >
            QUIT
          </button>
        </div>
      </section>

      {game.phase === 'feedback' && game.feedbackMessage && (
        <div
          role="alert"
          className={`mx-2 mb-2 p-2 text-center font-pixel text-[8px] sm:text-[10px] shrink-0 ${
            game.feedbackCorrect ? 'text-[#55efc4]' : 'text-[#ff7675]'
          }`}
        >
          {game.feedbackMessage}
          {!game.feedbackCorrect && (
            <p className="mt-1 text-[#a0c4d4] text-[6px] font-body leading-snug">
              {explainConversion(
                game.question.sourceType,
                game.question.sourceValue,
                game.question.targetType,
              )}
            </p>
          )}
        </div>
      )}
    </ArcadeCabinet>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#1a1a2e] py-4">
      <div className="relative z-10 max-w-4xl mx-auto px-2">{children}</div>
    </div>
  )
}

export default App
