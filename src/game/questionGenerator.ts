import {
  denaryToBinary8,
  denaryToHex8,
} from '../utils/conversions'
import { resolveMode } from '../utils/validation'
import type { ConversionMode, Difficulty, Question } from './types'

export function generateQuestion(mode: ConversionMode, _difficulty: Difficulty): Question {
  const resolved = resolveMode(mode)
  const denary = Math.floor(Math.random() * 256)
  const binary = denaryToBinary8(denary)
  const hex = denaryToHex8(denary)
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  switch (resolved) {
    case 'binary-to-denary':
      return {
        id,
        mode: resolved,
        sourceType: 'binary',
        targetType: 'denary',
        sourceValue: binary,
        correctAnswer: String(denary),
        sourceLabel: 'Binary',
        targetLabel: 'Denary',
      }
    case 'denary-to-binary':
      return {
        id,
        mode: resolved,
        sourceType: 'denary',
        targetType: 'binary',
        sourceValue: String(denary),
        correctAnswer: binary,
        sourceLabel: 'Denary',
        targetLabel: 'Binary',
      }
    case 'binary-to-hex':
      return {
        id,
        mode: resolved,
        sourceType: 'binary',
        targetType: 'hex',
        sourceValue: binary,
        correctAnswer: hex,
        sourceLabel: 'Binary',
        targetLabel: 'Hex',
      }
    case 'hex-to-binary':
      return {
        id,
        mode: resolved,
        sourceType: 'hex',
        targetType: 'binary',
        sourceValue: hex,
        correctAnswer: binary,
        sourceLabel: 'Hex',
        targetLabel: 'Binary',
      }
    case 'denary-to-hex':
      return {
        id,
        mode: resolved,
        sourceType: 'denary',
        targetType: 'hex',
        sourceValue: String(denary),
        correctAnswer: hex,
        sourceLabel: 'Denary',
        targetLabel: 'Hex',
      }
    case 'hex-to-denary':
      return {
        id,
        mode: resolved,
        sourceType: 'hex',
        targetType: 'denary',
        sourceValue: hex,
        correctAnswer: String(denary),
        sourceLabel: 'Hex',
        targetLabel: 'Denary',
      }
  }
}

