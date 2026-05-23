import { describe, expect, it } from 'vitest'
import {
  binary8ToDenary,
  binary8ToHex,
  denaryToBinary8,
  denaryToHex8,
  hex8ToDenary,
  hexToBinary8,
} from './conversions'
import { generateQuestion, validateAnswer } from './validation'

const CASES = [
  { d: 0, b: '00000000', h: '00' },
  { d: 1, b: '00000001', h: '01' },
  { d: 10, b: '00001010', h: '0A' },
  { d: 15, b: '00001111', h: '0F' },
  { d: 16, b: '00010000', h: '10' },
  { d: 127, b: '01111111', h: '7F' },
  { d: 128, b: '10000000', h: '80' },
  { d: 255, b: '11111111', h: 'FF' },
] as const

describe('conversions', () => {
  it.each(CASES)('denary $d ↔ binary $b ↔ hex $h', ({ d, b, h }) => {
    expect(denaryToBinary8(d)).toBe(b)
    expect(binary8ToDenary(b)).toBe(d)
    expect(denaryToHex8(d)).toBe(h)
    expect(hex8ToDenary(h)).toBe(d)
    expect(binary8ToHex(b)).toBe(h)
    expect(hexToBinary8(h)).toBe(b)
  })

  it('clamps out of range denary', () => {
    expect(denaryToBinary8(300)).toBe('11111111')
    expect(denaryToBinary8(-5)).toBe('00000000')
  })

  it('pads short binary and hex', () => {
    expect(denaryToBinary8(5)).toBe('00000101')
    expect(denaryToHex8(5)).toBe('05')
  })
})

describe('generateQuestion & validateAnswer', () => {
  const modes = [
    'binary-to-denary',
    'denary-to-binary',
    'binary-to-hex',
    'hex-to-binary',
    'denary-to-hex',
    'hex-to-denary',
  ] as const

  it.each(modes)('mode %s produces valid round', (mode) => {
    const q = generateQuestion(mode, 'medium')
    expect(q.mode).toBe(mode)
    expect(validateAnswer(q, q.correctAnswer)).toBe(true)
    expect(validateAnswer(q, 'WRONG')).toBe(false)
  })

  it('mixed mode resolves to a specific conversion', () => {
    const q = generateQuestion('mixed', 'easy')
    expect(modes).toContain(q.mode)
  })
})
