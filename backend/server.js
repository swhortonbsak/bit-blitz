'use strict'

const express = require('express')
const Database = require('better-sqlite3')
const { randomBytes } = require('crypto')
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
    timestamp INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    questions_answered INTEGER NOT NULL,
    best_streak INTEGER NOT NULL
  )
`)

const VALID_MODES = new Set([
  'binary-to-denary','denary-to-binary','binary-to-hex',
  'hex-to-binary','denary-to-hex','hex-to-denary','mixed',
])
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])

const app = express()
app.use(express.json())

app.get('/scores', (req, res) => {
  const { filter, mode, difficulty } = req.query
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

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(
    `SELECT id, nickname, score, mode, difficulty, timestamp, accuracy,
            questions_answered AS questionsAnswered, best_streak AS bestStreak
     FROM scores ${where} ORDER BY score DESC LIMIT 50`
  ).all(params)

  res.json({ entries: rows })
})

app.post('/scores', (req, res) => {
  const { nickname, score, mode, difficulty, accuracy, questionsAnswered, bestStreak } = req.body ?? {}

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
    timestamp: Date.now(),
    accuracy: Math.round(Math.max(0, Math.min(100, Number(accuracy) || 0))),
    questionsAnswered: Math.max(0, Math.round(Number(questionsAnswered) || 0)),
    bestStreak: Math.max(0, Math.round(Number(bestStreak) || 0)),
  }

  db.prepare(`
    INSERT INTO scores (id, nickname, score, mode, difficulty, timestamp, accuracy, questions_answered, best_streak)
    VALUES (@id, @nickname, @score, @mode, @difficulty, @timestamp, @accuracy, @questionsAnswered, @bestStreak)
  `).run(entry)

  res.json({ entry })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => console.log(`Leaderboard API listening on :${PORT}`))
