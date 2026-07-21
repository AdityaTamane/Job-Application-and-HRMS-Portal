// ---------------------------------------------------------------------------
// On-device review sentiment & theme extraction (no server, no API keys).
// A transparent lexicon model: positive/negative word lists with light
// negation handling, plus keyword→theme mapping to surface what customers
// consistently praise (or flag) about a pro.
// ---------------------------------------------------------------------------

const POSITIVE = new Set([
  'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful', 'best', 'perfect',
  'professional', 'punctual', 'timely', 'prompt', 'clean', 'tidy', 'neat', 'spotless', 'friendly',
  'polite', 'courteous', 'respectful', 'kind', 'helpful', 'quick', 'fast', 'efficient', 'thorough',
  'careful', 'meticulous', 'skilled', 'expert', 'knowledgeable', 'experienced', 'reliable', 'recommend',
  'recommended', 'satisfied', 'happy', 'pleased', 'value', 'worth', 'affordable', 'responsive', 'lovely',
  'impressed', 'trustworthy', 'smooth', 'brilliant', 'superb',
])

const NEGATIVE = new Set([
  'bad', 'poor', 'terrible', 'awful', 'worst', 'horrible', 'late', 'delayed', 'rude', 'dirty', 'messy',
  'unprofessional', 'careless', 'sloppy', 'slow', 'disappointed', 'disappointing', 'damage', 'damaged',
  'broke', 'broken', 'expensive', 'overpriced', 'unreliable', 'avoid', 'rushed', 'unhappy', 'waste',
  'poorly', 'never',
])

const NEGATORS = new Set(['not', 'no', "wasn't", 'wasnt', "didn't", 'didnt', "don't", 'dont', 'never', 'hardly'])

// keyword → human theme label
const THEME_MAP: { words: string[]; theme: string }[] = [
  { words: ['punctual', 'timely', 'prompt', 'ontime', 'time'], theme: 'Punctual' },
  { words: ['professional', 'courteous', 'polite', 'respectful', 'manners'], theme: 'Professional' },
  { words: ['clean', 'tidy', 'neat', 'spotless', 'hygiene'], theme: 'Clean & tidy' },
  { words: ['thorough', 'detailed', 'careful', 'meticulous', 'thoroughly'], theme: 'Thorough' },
  { words: ['friendly', 'kind', 'nice', 'warm', 'lovely', 'polite'], theme: 'Friendly' },
  { words: ['quick', 'fast', 'efficient', 'prompt', 'speedy'], theme: 'Efficient' },
  { words: ['value', 'worth', 'affordable', 'reasonable', 'price', 'cheap'], theme: 'Great value' },
  { words: ['skilled', 'expert', 'knowledgeable', 'experienced', 'skill'], theme: 'Skilled' },
  { words: ['responsive', 'communication', 'communicative', 'updates', 'informed'], theme: 'Communicative' },
]

export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface ReviewAnalysis {
  score: number // -1..1
  sentiment: Sentiment
  themes: string[]
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s']/g, ' ').split(/\s+/).filter(Boolean)
}

export function analyzeReview(text: string): ReviewAnalysis {
  const tokens = tokenize(text)
  let pos = 0
  let neg = 0
  tokens.forEach((tok, i) => {
    const negated = i > 0 && NEGATORS.has(tokens[i - 1])
    if (POSITIVE.has(tok)) {
      if (negated) neg++
      else pos++
    } else if (NEGATIVE.has(tok)) {
      if (negated) pos++
      else neg++
    }
  })
  const total = pos + neg
  const score = total === 0 ? 0 : (pos - neg) / total
  const sentiment: Sentiment = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral'

  const themes: string[] = []
  for (const { words, theme } of THEME_MAP) {
    if (words.some((w) => tokens.includes(w)) && !themes.includes(theme)) themes.push(theme)
  }
  return { score, sentiment, themes }
}

export interface ReviewSummary {
  count: number
  positivePct: number
  sentiment: Sentiment
  topThemes: { theme: string; count: number }[]
}

/** Aggregate sentiment + most-praised themes across a set of review texts. */
export function summarizeReviews(texts: string[]): ReviewSummary | null {
  const clean = texts.filter((t) => t && t.trim())
  if (!clean.length) return null
  let positive = 0
  let netScore = 0
  const themeCounts = new Map<string, number>()
  for (const t of clean) {
    const a = analyzeReview(t)
    if (a.sentiment === 'positive') positive++
    netScore += a.score
    a.themes.forEach((th) => themeCounts.set(th, (themeCounts.get(th) ?? 0) + 1))
  }
  const avg = netScore / clean.length
  return {
    count: clean.length,
    positivePct: Math.round((positive / clean.length) * 100),
    sentiment: avg > 0.15 ? 'positive' : avg < -0.15 ? 'negative' : 'neutral',
    topThemes: [...themeCounts.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
  }
}

export const SENTIMENT_META: Record<Sentiment, { emoji: string; label: string; tone: 'green' | 'gray' | 'red' }> = {
  positive: { emoji: '😀', label: 'Positive', tone: 'green' },
  neutral: { emoji: '😐', label: 'Neutral', tone: 'gray' },
  negative: { emoji: '😞', label: 'Negative', tone: 'red' },
}
