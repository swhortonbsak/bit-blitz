import { describe, expect, it } from 'vitest'
import { containsProfanity, normalizeCompact } from './profanityFilter'
import { isNicknameAllowed } from './leaderboardStorage'

describe('profanityFilter', () => {
  it('blocks obvious profanity', () => {
    expect(containsProfanity('shithead')).toBe(true)
    expect(containsProfanity('whatthefuck')).toBe(true)
    expect(containsProfanity('bitch')).toBe(true)
  })

  it('blocks leetspeak obfuscation', () => {
    expect(containsProfanity('f#ck')).toBe(true)
    expect(containsProfanity('sh1t')).toBe(true)
    expect(containsProfanity('b1tch')).toBe(true)
  })

  it('allows innocent names and school words', () => {
    expect(containsProfanity('classroom')).toBe(false)
    expect(containsProfanity('classic')).toBe(false)
    expect(containsProfanity('hello')).toBe(false)
    expect(containsProfanity('pass')).toBe(false)
    expect(containsProfanity('glass')).toBe(false)
    expect(containsProfanity('Bobby')).toBe(false)
    expect(containsProfanity('Year7')).toBe(false)
    expect(containsProfanity('Sussex')).toBe(false)
    expect(containsProfanity('Skillz')).toBe(false)
  })

  it('normalizeCompact collapses repeated letters', () => {
    expect(normalizeCompact('shhhit')).toContain('shit')
  })
})

describe('isNicknameAllowed', () => {
  it('rejects blocked nicknames', () => {
    expect(isNicknameAllowed('xShItx')).toBe(false)
    expect(isNicknameAllowed('')).toBe(false)
  })

  it('accepts clean nicknames', () => {
    expect(isNicknameAllowed('StarCoder')).toBe(true)
    expect(isNicknameAllowed('Room7A')).toBe(true)
  })
})
