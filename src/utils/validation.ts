import {
  normalizeBinary8,
  normalizeHex8,
  clampDenary,
} from './conversions'
import type { ConversionMode, Question } from '../game/types'
import { generateQuestion } from '../game/questionGenerator'

export { generateQuestion }

const SPECIFIC_MODES = [
  'binary-to-denary',
  'denary-to-binary',
  'binary-to-hex',
  'hex-to-binary',
  'denary-to-hex',
  'hex-to-denary',
] as const

export function isValidDenaryInput(value: string): boolean {
  if (!/^\d{1,3}$/.test(value.trim())) return false
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= 255
}

export function isValidBinaryInput(value: string): boolean {
  const cleaned = value.replace(/\s/g, '')
  return /^[01]{8}$/.test(cleaned)
}

export function isValidHexInput(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').toUpperCase()
  return /^[0-9A-F]{2}$/.test(cleaned)
}

export function sanitizeHexInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^0-9A-F]/g, '')
    .slice(0, 2)
}

export function sanitizeDenaryInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3)
}

export function normalizeAnswer(
  targetType: 'binary' | 'denary' | 'hex',
  answer: string,
): string {
  switch (targetType) {
    case 'binary':
      return normalizeBinary8(answer.replace(/\s/g, ''))
    case 'denary':
      return String(clampDenary(Number(answer.trim())))
    case 'hex':
      return normalizeHex8(answer)
  }
}

export function validateAnswer(question: Question, answer: string): boolean {
  try {
    const normalized = normalizeAnswer(question.targetType, answer)
    return normalized === question.correctAnswer
  } catch {
    return false
  }
}

export function pickRandomMode(): (typeof SPECIFIC_MODES)[number] {
  return SPECIFIC_MODES[Math.floor(Math.random() * SPECIFIC_MODES.length)]
}

export function resolveMode(mode: ConversionMode): (typeof SPECIFIC_MODES)[number] {
  if (mode === 'mixed') return pickRandomMode()
  return mode
}
