'use strict'

const express = require('express')
const Database = require('better-sqlite3')
const { randomBytes, createHmac, timingSafeEqual } = require('crypto')
const path = require('path')
const fs = require('fs')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'scores.db'))
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    score INTEGER NOT NULL,
    mode TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    timer_enabled INTEGER NOT NULL DEFAULT 1,
    timestamp INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    questions_answered INTEGER NOT NULL,
    best_streak INTEGER NOT NULL
  )
`)

// Migrate existing DB: add timer_enabled column if absent
try {
  db.exec(`ALTER TABLE scores ADD COLUMN timer_enabled INTEGER NOT NULL DEFAULT 1`)
} catch (_) {
  // Column already exists — nothing to do
}

// ── Anti-cheat: seal token system ────────────────────────────────────────────
// A seal token is a short-lived, single-use HMAC-signed token issued by
// POST /seal-score after plausibility checks. POST /scores won't accept
// any submission without a valid matching seal token — meaning direct API
// calls from the browser console will always be rejected.

// Ephemeral signing secret (new each server start — tokens from previous
// start are automatically invalidated)
const SEAL_SECRET = randomBytes(32).toString('hex')

// In-memory seal token store: Map<token, { used: bool, expiresAt: number }>
const sealTokenStore = new Map()

// Clean up expired tokens (called on each seal-score request)
function pruneSealTokens() {
  const now = Date.now()
  for (const [t, meta] of sealTokenStore) {
    if (now > meta.expiresAt) sealTokenStore.delete(t)
  }
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Simple in-memory per-IP rate limiter
const rateLimitStore = new Map()

function getIP(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress
    || 'unknown'
}

/**
 * Returns true if the request is within the allowed rate.
 * @param {string} ip
 * @param {string} key   bucket key (e.g. 'seal' or 'score')
 * @param {number} max   max requests per window
 * @param {number} windowMs  window in milliseconds
 */
function withinRateLimit(ip, key, max, windowMs) {
  const bucket = `${ip}:${key}`
  const now = Date.now()
  let rec = rateLimitStore.get(bucket)
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + windowMs }
    rateLimitStore.set(bucket, rec)
  }
  rec.count++
  return rec.count <= max
}

// ── Score plausibility ────────────────────────────────────────────────────────
// Max points achievable per question per difficulty (base 100 + speedBonus 60,
// streak ×2.0 max, difficulty multiplier)
const MAX_SCORE_PER_Q = { easy: 325, medium: 325, hard: 490, insane: 650 }
// Max questions answerable in a 5-minute timed session
// (min round time ≈ 2.5 s: 0.9 s spawn gap + 1.6 s feedback)
const MAX_TIMED_QUESTIONS = { easy: 200, medium: 150, hard: 130, insane: 130 }
// Allow 30 % headroom above theoretical max
const PLAUSIBILITY_FACTOR = 1.3

function isScorePlausible(score, questionsAnswered, difficulty, timerEnabled) {
  if (typeof score !== 'number' || score < 0) return false
  if (typeof questionsAnswered !== 'number' || questionsAnswered < 1) return false
  const maxPerQ = MAX_SCORE_PER_Q[difficulty] || 325
  const maxQ = timerEnabled ? (MAX_TIMED_QUESTIONS[difficulty] || 150) : 5000
  if (questionsAnswered > maxQ) return false
  if (score > questionsAnswered * maxPerQ * PLAUSIBILITY_FACTOR) return false
  return true
}

const VALID_MODES = new Set([
  'binary-to-denary','denary-to-binary','binary-to-hex',
  'hex-to-binary','denary-to-hex','hex-to-denary','mixed',
])
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'insane'])
const {
  hasUniformIntervalPattern,
  normalizeAnswerIntervals,
  serializeAnswerIntervals,
  parseAnswerIntervals,
  intervalsMatch,
} = require('./answerTimingGuard')

function rejectCheating(res) {
  return res.status(403).json({ error: 'Cheating detected.', code: 'CHEATING_DETECTED' })
}

const app = express()
app.use(express.json())

// ── GET /scores ───────────────────────────────────────────────────────────────
app.get('/scores', (req, res) => {
  const { filter, mode, difficulty, timerEnabled } = req.query
  const conditions = []
  const params = {}

  if (filter === 'today') {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    conditions.push('timestamp >= @since')
    params.since = d.getTime()
  } else if (filter === 'week') {
    const d = new Date()
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
    d.setHours(0, 0, 0, 0)
    conditions.push('timestamp >= @since')
    params.since = d.getTime()
  }

  if (mode && VALID_MODES.has(mode)) { conditions.push('mode = @mode'); params.mode = mode }
  if (difficulty && VALID_DIFFICULTIES.has(difficulty)) { conditions.push('difficulty = @difficulty'); params.difficulty = difficulty }
  if (timerEnabled === 'true') { conditions.push('timer_enabled = 1') }
  else if (timerEnabled === 'false') { conditions.push('timer_enabled = 0') }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(
    `SELECT id, nickname, score, mode, difficulty,
            timer_enabled AS timerEnabled,
            timestamp, accuracy,
            questions_answered AS questionsAnswered, best_streak AS bestStreak
     FROM scores ${where} ORDER BY score DESC LIMIT 50`
  ).all(params)

  res.json({ entries: rows.map(r => ({ ...r, timerEnabled: r.timerEnabled === 1 })) })
})

// ── POST /seal-score ──────────────────────────────────────────────────────────
// Called by the app the moment the game ends (before the player enters a
// nickname). Validates plausibility and returns a short-lived, single-use
// HMAC-signed token that binds the score/stats. POST /scores won't accept
// submissions without a matching valid token.
app.post('/seal-score', (req, res) => {
  const ip = getIP(req)
  // 25 seals per hour per IP (generous for legitimate players)
  if (!withinRateLimit(ip, 'seal', 25, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }

  pruneSealTokens()

  const { score, questionsAnswered, difficulty, mode, timerEnabled, answerIntervals } = req.body ?? {}

  if (!VALID_MODES.has(mode) || !VALID_DIFFICULTIES.has(difficulty)) {
    return res.status(400).json({ error: 'Invalid game parameters.' })
  }

  if (!isScorePlausible(score, questionsAnswered, difficulty, timerEnabled)) {
    return res.status(400).json({ error: 'Score could not be verified.' })
  }

  const normalizedIntervals = normalizeAnswerIntervals(answerIntervals)
  if (hasUniformIntervalPattern(normalizedIntervals)) {
    return rejectCheating(res)
  }

  const nonce = randomBytes(8).toString('hex')
  const ts = Date.now()
  const te = timerEnabled ? 1 : 0
  const intervalsSerialized = serializeAnswerIntervals(normalizedIntervals)
  // Payload binds every field used when saving the score
  const payload = [score, questionsAnswered, difficulty, mode, te, intervalsSerialized, nonce, ts].join('|')
  const sig = createHmac('sha256', SEAL_SECRET).update(payload).digest('hex')
  const token = Buffer.from(payload).toString('base64url') + '.' + sig

  // Valid for 10 minutes, single-use
  sealTokenStore.set(token, { used: false, expiresAt: ts + 10 * 60 * 1000 })

  res.json({ token })
})

// ── POST /scores ──────────────────────────────────────────────────────────────
app.post('/scores', (req, res) => {
  const ip = getIP(req)
  // 10 score submissions per 5 minutes per IP
  if (!withinRateLimit(ip, 'score', 10, 5 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many submissions. Please wait a moment.' })
  }

  const {
    nickname, score, mode, difficulty, timerEnabled,
    accuracy, questionsAnswered, bestStreak, sealToken, answerIntervals,
  } = req.body ?? {}

  const normalizedIntervals = normalizeAnswerIntervals(answerIntervals)
  if (hasUniformIntervalPattern(normalizedIntervals)) {
    return rejectCheating(res)
  }

  // ── Seal token validation ─────────────────────────────────────────────────
  if (!sealToken || typeof sealToken !== 'string') {
    return res.status(400).json({ error: 'Missing game session token.' })
  }

  const sealMeta = sealTokenStore.get(sealToken)
  if (!sealMeta || sealMeta.used || Date.now() > sealMeta.expiresAt) {
    return res.status(400).json({ error: 'Game session token is invalid or expired. Please play a new game.' })
  }

  try {
    const lastDot = sealToken.lastIndexOf('.')
    const datab64 = sealToken.substring(0, lastDot)
    const submittedSig = sealToken.substring(lastDot + 1)
    const payload = Buffer.from(datab64, 'base64url').toString()
    const expectedSig = createHmac('sha256', SEAL_SECRET).update(payload).digest('hex')

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(submittedSig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      throw new Error('bad signature')
    }

    // Verify submitted fields exactly match the sealed payload
    const [sScore, sQ, sDiff, sMode, sTe, sIntervals] = payload.split('|')
    const teMatch = (sTe === '1') === Boolean(timerEnabled)
    if (
      Math.round(Number(sScore)) !== Math.round(Number(score)) ||
      Math.round(Number(sQ)) !== Math.round(Number(questionsAnswered)) ||
      sDiff !== difficulty ||
      sMode !== mode ||
      !teMatch ||
      !intervalsMatch(parseAnswerIntervals(sIntervals), normalizedIntervals)
    ) {
      return res.status(400).json({ error: 'Score data does not match game session.' })
    }
  } catch {
    return res.status(400).json({ error: 'Invalid game session token.' })
  }

  // Mark token as used (prevents replay)
  sealMeta.used = true

  // ── Standard field validation ─────────────────────────────────────────────
  if (!nickname || typeof score !== 'number' || !VALID_MODES.has(mode) || !VALID_DIFFICULTIES.has(difficulty)) {
    return res.status(400).json({ error: 'Invalid or missing fields.' })
  }

  const safeNickname = String(nickname).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 12)
  if (!safeNickname) return res.status(400).json({ error: 'Nickname is required.' })

  const entry = {
    id: `lb-${Date.now()}-${randomBytes(3).toString('hex')}`,
    nickname: safeNickname,
    score: Math.max(0, Math.round(Number(score))),
    mode,
    difficulty,
    timerEnabled: timerEnabled === false ? 0 : 1,
    timestamp: Date.now(),
    accuracy: Math.round(Math.max(0, Math.min(100, Number(accuracy) || 0))),
    questionsAnswered: Math.max(0, Math.round(Number(questionsAnswered) || 0)),
    bestStreak: Math.max(0, Math.round(Number(bestStreak) || 0)),
  }

  db.prepare(`
    INSERT INTO scores (id, nickname, score, mode, difficulty, timer_enabled, timestamp, accuracy, questions_answered, best_streak)
    VALUES (@id, @nickname, @score, @mode, @difficulty, @timerEnabled, @timestamp, @accuracy, @questionsAnswered, @bestStreak)
  `).run(entry)

  res.json({ entry: { ...entry, timerEnabled: entry.timerEnabled === 1 } })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => console.log(`Leaderboard API listening on :${PORT}`))
