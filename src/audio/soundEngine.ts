/** Procedural 8-bit style sounds via Web Audio — no external assets. */

const STORAGE_KEY = 'bit-blitz-sound-enabled'

export type SoundName =
  | 'flip'
  | 'fire'
  | 'hit'
  | 'miss'
  | 'breach'
  | 'start'
  | 'gameOver'
  | 'menu'

class SoundEngine {
  private ctx: AudioContext | null = null
  private _enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      this._enabled = stored !== 'false'
    }
  }

  get enabled(): boolean {
    return this._enabled
  }

  set enabled(value: boolean) {
    this._enabled = value
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(value))
    }
  }

  toggle(): boolean {
    this.enabled = !this._enabled
    return this._enabled
  }

  private ensureCtx(): AudioContext | null {
    if (!this._enabled) return null
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext()
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
      return this.ctx
    } catch {
      return null
    }
  }

  /** Call on first user gesture so audio can play */
  unlock(): void {
    this.ensureCtx()
  }

  play(name: SoundName): void {
    if (!this._enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return

    const t = ctx.currentTime
    switch (name) {
      case 'flip':
        this.beep(ctx, 880, 0.04, 'square', 0.08, t)
        break
      case 'fire':
        this.beep(ctx, 220, 0.08, 'sawtooth', 0.12, t)
        this.beep(ctx, 440, 0.06, 'square', 0.06, t + 0.04)
        break
      case 'hit':
        ;[523, 659, 784, 1047].forEach((f, i) =>
          this.beep(ctx, f, 0.07, 'square', 0.1, t + i * 0.05),
        )
        break
      case 'miss':
        this.beep(ctx, 110, 0.15, 'sawtooth', 0.15, t)
        this.beep(ctx, 90, 0.2, 'square', 0.08, t + 0.08)
        break
      case 'breach':
        this.beep(ctx, 80, 0.35, 'sawtooth', 0.2, t)
        this.noiseBurst(ctx, 0.25, 0.12, t)
        break
      case 'start':
        ;[392, 494, 587, 784].forEach((f, i) =>
          this.beep(ctx, f, 0.1, 'square', 0.12, t + i * 0.07),
        )
        break
      case 'gameOver':
        ;[392, 349, 330, 262].forEach((f, i) =>
          this.beep(ctx, f, 0.2, 'triangle', 0.12, t + i * 0.12),
        )
        break
      case 'menu':
        this.beep(ctx, 660, 0.05, 'square', 0.06, t)
        break
    }
  }

  private beep(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    start: number,
  ): void {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(gain, start)
    g.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  private noiseBurst(
    ctx: AudioContext,
    duration: number,
    gain: number,
    start: number,
  ): void {
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, start)
    g.gain.exponentialRampToValueAtTime(0.001, start + duration)
    src.connect(g)
    g.connect(ctx.destination)
    src.start(start)
  }
}

export const soundEngine = new SoundEngine()
