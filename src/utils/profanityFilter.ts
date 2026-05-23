/**
 * Classroom-safe nickname filter. Blocks profanity, slurs, and common leetspeak obfuscation.
 * Uses whole-word checks where short patterns would false-positive (e.g. "class").
 */

const BLOCKED_TOKENS = new Set([
  'anal',
  'anus',
  'arse',
  'ass',
  'asses',
  'asshole',
  'ballsack',
  'bastard',
  'bimbo',
  'bitch',
  'bitches',
  'bloody',
  'blowjob',
  'bollock',
  'boner',
  'boob',
  'boobs',
  'bugger',
  'bullshit',
  'chink',
  'clit',
  'cock',
  'cocks',
  'coon',
  'crap',
  'cum',
  'cunt',
  'damn',
  'dick',
  'dildo',
  'dyke',
  'fag',
  'faggot',
  'fck',
  'fcuk',
  'felch',
  'fuck',
  'fucker',
  'fucking',
  'fuk',
  'fukk',
  'goddamn',
  'hell',
  'homo',
  'hooker',
  'jerk',
  'jizz',
  'kike',
  'kill',
  'kys',
  'lesbo',
  'milf',
  'muff',
  'nazi',
  'negro',
  'nigga',
  'nigger',
  'penis',
  'piss',
  'porn',
  'prick',
  'pube',
  'pussy',
  'queer',
  'rape',
  'rapist',
  'retard',
  'scrotum',
  'sex',
  'shag',
  'shit',
  'shite',
  'slut',
  'spastic',
  'spic',
  'tit',
  'tits',
  'turd',
  'twat',
  'vagina',
  'wank',
  'wanker',
  'whore',
  'wtf',
])

/** Distinctive strings — safe to match inside compacted text (unlikely in innocent words). */
const BLOCKED_COMPACT_SUBSTRINGS = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'whore',
  'slut',
  'bastard',
  'wanker',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'penis',
  'vagina',
  'pussy',
  'bollock',
  'asshole',
  'bullshit',
]

/** Repeated-char padding used to hide words: ssshhit */
const REPEAT_COLLAPSE = /(.)\1{2,}/g

export function normalizeCompact(text: string): string {
  let s = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z0-9]/g, '')

  s = s.replace(REPEAT_COLLAPSE, '$1')
  return s
}

export function tokenizeNickname(text: string): string[] {
  const lower = text.toLowerCase()
  const parts = lower.split(/[^a-z0-9]+/).filter((p) => p.length > 0)
  const compact = normalizeCompact(text)
  const tokens = new Set(parts)
  if (compact.length > 0) tokens.add(compact)
  return [...tokens]
}

export function containsProfanity(text: string): boolean {
  if (!text.trim()) return false

  const tokens = tokenizeNickname(text)
  for (const token of tokens) {
    if (BLOCKED_TOKENS.has(token)) return true
  }

  const compact = normalizeCompact(text)
  if (!compact) return false

  for (const blocked of BLOCKED_COMPACT_SUBSTRINGS) {
    if (compact.includes(blocked)) return true
  }

  return false
}

export function nicknameFilterMessage(): string {
  return 'That nickname is not allowed. Please use a school-appropriate name.'
}
