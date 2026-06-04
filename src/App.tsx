import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSound } from './audio/SoundContext'
import { ArcadeCabinet } from './components/ArcadeCabinet'
import { ArcadeKeypad } from './components/ArcadeKeypad'
import { BitPanel, getBitIndexFromKey } from './components/BitPanel'
import { BunkerMonitor } from './components/BunkerMonitor'
import { CheatingDetectedScreen } from './components/CheatingDetectedScreen'
import { GameHUD } from './components/GameHUD'
import { GameOverScreen } from './components/GameOverScreen'
import { HintPanel } from './components/HintPanel'
import { Leaderboard } from './components/Leaderboard'
import { ArcadePlayfield, getThreatPosition } from './components/ArcadePlayfield'
import type { ExplosionFxState, MissileStrikeState } from './components/ArcadePlayfield'
import { PauseOverlay } from './components/PauseOverlay'
import { StartScreen } from './components/StartScreen'
import {
  advanceRound,
  createInitialState,
  fireAnswer,
  flipBit,
  getCurrentAnswer,
  getPrimaryThreat,
  pauseGame,
  resumeGame,
  setTypedAnswer,
  tickGame,
  toggleHint,
  type GameState,
} from './game/gameEngine'
import type { ConversionMode, Difficulty } from './game/types'
import { DIFFICULTY_CONFIG, getAnswerStyle } from './game/types'
import { explainConversion } from './utils/conversions'
import { getHighScore, updateHighScore } from './utils/highScore'
import { canPauseNow, msUntilPauseAvailable, recordPauseUsed } from './utils/pauseCooldown'
import { recordAnswerEvent, type AnswerEvent } from './utils/answerTimingGuard'
import { isTimerIntegrityOk, isTrustedInput } from './utils/inputTrust'
import { validateAnswer } from './utils/validation'

type AppScreen = 'start' | 'playing' | 'leaderboard' | 'cheating'

function App() {
  const { play, unlock } = useSound()
  const [screen, setScreen] = useState<AppScreen>('start')
  const [selectedMode, setSelectedMode] = useState<ConversionMode>('hex-to-binary')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy')
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [game, setGame] = useState<GameState | null>(null)
  const [highScore, setHighScore] = useState(getHighScore)
  const [missileStrike, setMissileStrike] = useState<MissileStrikeState | null>(null)
  const [explosionFx, setExplosionFx] = useState<ExplosionFxState | null>(null)
  const [pauseCooldownMs, setPauseCooldownMs] = useState(msUntilPauseAvailable)
  const prevPhase = useRef<string | null>(null)
  const missilesBusy = useRef(false)
  const missileStrikeRef = useRef<MissileStrikeState | null>(null)
  const answerEventsRef = useRef<AnswerEvent[]>([])
  const gameSessionStartRef = useRef(0)
  const [sessionPlayMs, setSessionPlayMs] = useState(0)
  missileStrikeRef.current = missileStrike

  const triggerCheatingDetected = useCallback(() => {
    setGame(null)
    setMissileStrike(null)
    setExplosionFx(null)
    missilesBusy.current = false
    setScreen('cheating')
  }, [])

  const trackAnswerEvent = useCallback((at: number, reactionMs: number) => {
    answerEventsRef.current = recordAnswerEvent(answerEventsRef.current, at, reactionMs)
  }, [])

  const startGame = useCallback(() => {
    unlock()
    play('start')
    answerEventsRef.current = []
    gameSessionStartRef.current = performance.now()
    setSessionPlayMs(0)
    setGame(createInitialState({ mode: selectedMode, difficulty: selectedDifficulty, timerEnabled }))
    setScreen('playing')
  }, [selectedMode, selectedDifficulty, timerEnabled, play, unlock])

  useEffect(() => {
    if (!game) return
    if (game.config.difficulty === 'practice') return
    const hi = updateHighScore(game.stats.score)
    setHighScore(hi)
  }, [game?.stats.score])

  useEffect(() => {
    if (screen !== 'playing' || !game || game.phase !== 'playing') return

    let last = performance.now()
    let rafId = 0
    const frame = () => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      setGame((g) => (g ? tickGame(g, delta) : g))
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(rafId)
  }, [screen, game?.phase, game?.question.id])

  useEffect(() => {
    if (screen !== 'playing') return
    const update = () => setPauseCooldownMs(msUntilPauseAvailable())
    update()
    const id = window.setInterval(update, 1000)
    return () => clearInterval(id)
  }, [screen, game?.phase])

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
      setSessionPlayMs(Math.round(performance.now() - gameSessionStartRef.current))
    }
    prevPhase.current = game.phase
  }, [game?.phase, game?.feedbackCorrect, game?.feedbackMessage, play])

  useEffect(() => {
    if (!game || game.phase !== 'feedback') return

    const durationMs = game.feedbackCorrect ? 1600 : 2400
    const start = performance.now()
    let rafId = 0

    const tick = () => {
      if (performance.now() - start >= durationMs) {
        setGame((g) => {
          if (!g) return g
          if (g.phase === 'gameover') return g
          return advanceRound(g)
        })
        return
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
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
    // Pass submittedAt so fireAnswer in engine can skip the timing check for
    // missile-triggered commits (timing was already checked in handleFire)
    const submittedAt = (strike as MissileStrikeState & { submittedAt?: number }).submittedAt
    const now = submittedAt ?? Date.now()
    setGame((g) => {
      if (!g) return g
      const reactionMs = (submittedAt ?? now) - g.questionSpawnedAt
      trackAnswerEvent(submittedAt ?? now, reactionMs)
      return fireAnswer(g, true, submittedAt)
    })
    const impactStart = performance.now()
    const clearImpact = () => {
      if (performance.now() - impactStart >= 1400) {
        setExplosionFx(null)
        missilesBusy.current = false
        return
      }
      requestAnimationFrame(clearImpact)
    }
    requestAnimationFrame(clearImpact)
  }, [play, trackAnswerEvent])

  const handleFire = useCallback(() => {
    if (!isTimerIntegrityOk()) {
      triggerCheatingDetected()
      return
    }
    if (!game || game.phase !== 'playing' || missilesBusy.current) return
    const answer = getCurrentAnswer(game)
    const q = game.question

    if (q.targetType === 'binary' && answer.length !== 8) return
    if (q.targetType === 'denary' && !/^\d{1,3}$/.test(answer)) return
    if (q.targetType === 'hex' && answer.length !== 2) return

    // Anti-cheat: reject answers fired impossibly fast after the question spawned
    const elapsed = Date.now() - game.questionSpawnedAt
    if (elapsed < 300) return

    play('fire')
    const correct = validateAnswer(q, answer)

    const primary = getPrimaryThreat(game.threats)
    if (correct && primary) {
      missilesBusy.current = true
      const now = Date.now()
      const strike = { ...getThreatPosition(primary), key: now, submittedAt: now }
      setMissileStrike(strike as MissileStrikeState)
      return
    }

    const now = Date.now()
    setGame((g) => (g ? fireAnswer(g, correct, now) : g))
    trackAnswerEvent(now, elapsed)
  }, [game, play, trackAnswerEvent, triggerCheatingDetected])

  const handlePause = useCallback(() => {
    if (!game || game.phase !== 'playing' || missileStrike || !canPauseNow()) return
    recordPauseUsed()
    setPauseCooldownMs(msUntilPauseAvailable())
    setGame((g) => (g ? pauseGame(g) : g))
  }, [game, missileStrike])

  const handleResume = useCallback(() => {
    setGame((g) => (g ? resumeGame(g) : g))
  }, [])

  useEffect(() => {
    if (screen !== 'playing' || !game) return

    const onKey = (e: KeyboardEvent) => {
      if (!isTrustedInput(e)) return
      if (game.phase === 'gameover') return

      if (game.phase === 'paused') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault()
          handleResume()
        }
        return
      }

      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && game.phase === 'playing') {
        e.preventDefault()
        handlePause()
        return
      }

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
  }, [screen, game, handleFire, handlePause, handleResume, play])

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
          timerEnabled={timerEnabled}
          highScore={highScore}
          onModeChange={setSelectedMode}
          onDifficultyChange={setSelectedDifficulty}
          onTimerToggle={() => setTimerEnabled((t) => !t)}
          onPlay={startGame}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      </AppShell>
    )
  }

  if (screen === 'cheating') {
    return (
      <AppShell>
        <CheatingDetectedScreen
          onPlayAgain={startGame}
          onMenu={() => {
            answerEventsRef.current = []
            setGame(null)
            setScreen('start')
          }}
        />
      </AppShell>
    )
  }

  if (!game) return null

  if (game.phase === 'gameover') {
    const playMs =
      sessionPlayMs > 0
        ? sessionPlayMs
        : Math.round(performance.now() - gameSessionStartRef.current)
    return (
      <AppShell>
        <GameOverScreen
          config={game.config}
          stats={game.stats}
          answerEvents={answerEventsRef.current}
          sessionPlayMs={playMs}
          onPlayAgain={startGame}
          onMenu={() => {
            answerEventsRef.current = []
            setGame(null)
            setScreen('start')
          }}
          onLeaderboard={() => {
            setGame(null)
            setScreen('leaderboard')
          }}
          onCheatingDetected={triggerCheatingDetected}
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
        timerEnabled={game.config.timerEnabled}
        mode={game.config.mode}
        difficulty={game.config.difficulty}
        lastScoreDelta={game.lastScoreDelta}
        threats={game.threats}
        onPause={handlePause}
        pauseAvailable={pauseCooldownMs === 0}
        pauseCooldownMs={pauseCooldownMs}
      />

      <div className="relative flex-1 flex flex-col min-h-0">
        <ArcadePlayfield
          threats={game.threats}
          question={game.question}
          phase={game.phase}
          highScore={highScore}
          missileStrike={missileStrike}
          explosionFx={explosionFx}
          onMissileImpact={handleMissileImpact}
        />
        {game.phase === 'paused' && <PauseOverlay onResume={handleResume} />}
      </div>

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
            onClick={(e) => {
              if (!isTrustedInput(e.nativeEvent)) return
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
