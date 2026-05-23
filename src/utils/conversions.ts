/** 8-bit number conversion utilities (0–255, binary, hex). */

export const BINARY_PLACE_VALUES = [128, 64, 32, 16, 8, 4, 2, 1] as const

export function denaryToBinary8(n: number): string {
  const v = clampDenary(n)
  return v.toString(2).padStart(8, '0')
}

export function binary8ToDenary(binary: string): number {
  const normalized = normalizeBinary8(binary)
  return parseInt(normalized, 2)
}

export function denaryToHex8(n: number): string {
  const v = clampDenary(n)
  return v.toString(16).toUpperCase().padStart(2, '0')
}

export function hex8ToDenary(hex: string): number {
  const normalized = normalizeHex8(hex)
  return parseInt(normalized, 16)
}

export function binary8ToHex(binary: string): string {
  return denaryToHex8(binary8ToDenary(binary))
}

export function hexToBinary8(hex: string): string {
  return denaryToBinary8(hex8ToDenary(hex))
}

export function clampDenary(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(255, Math.floor(n)))
}

export function normalizeBinary8(binary: string): string {
  const cleaned = binary.replace(/\s/g, '')
  if (!/^[01]{1,8}$/.test(cleaned)) {
    throw new Error('Invalid binary: must be 1–8 bits of 0 or 1')
  }
  return cleaned.padStart(8, '0')
}

export function normalizeHex8(hex: string): string {
  const cleaned = hex.replace(/\s/g, '').toUpperCase()
  if (!/^[0-9A-F]{1,2}$/.test(cleaned)) {
    throw new Error('Invalid hex: must be 1–2 hex digits')
  }
  return cleaned.padStart(2, '0')
}

export function formatDenary(n: number): string {
  return String(clampDenary(n))
}

export function explainConversion(
  sourceType: 'binary' | 'denary' | 'hex',
  sourceValue: string,
  targetType: 'binary' | 'denary' | 'hex',
): string {
  const denary =
    sourceType === 'denary'
      ? clampDenary(Number(sourceValue))
      : sourceType === 'binary'
        ? binary8ToDenary(sourceValue)
        : hex8ToDenary(sourceValue)

  const binary = denaryToBinary8(denary)
  const hex = denaryToHex8(denary)

  const parts: string[] = []
  parts.push(`${formatDenary(denary)} in denary = ${binary} in binary = ${hex} in hex.`)

  if (targetType === 'binary' || sourceType === 'binary') {
    const bits = binary.split('').map((b, i) => `${b}×${BINARY_PLACE_VALUES[i]}`)
    parts.push(`Binary place values: ${BINARY_PLACE_VALUES.join(', ')}.`)
    parts.push(`(${bits.join(' + ')}) = ${denary}.`)
  }

  if (targetType === 'hex' || sourceType === 'hex') {
    const high = binary.slice(0, 4)
    const low = binary.slice(4)
    parts.push(
      `Hex uses nibbles: ${high}₂ = ${parseInt(high, 2)} → ${hex[0]}, ${low}₂ = ${parseInt(low, 2)} → ${hex[1]}.`,
    )
    parts.push(`A=10, B=11, C=12, D=13, E=14, F=15.`)
  }

  return parts.join(' ')
}
