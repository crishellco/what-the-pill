import { DEFAULT_SALT_SUFFIXES, DEFAULT_BRAND_NAMES } from './pharmaDefaults.js'

const STRENGTH_PATTERN = /(\d+(?:\.\d+)?\s*mg(?:\s*\/\s*\d+(?:\.\d+)?\s*mg)?)/i
const COUNTER_ION_PREFIX = /^(?:sodium|potassium|calcium|magnesium|zinc|lithium)\s+/i
const SALT_HEURISTIC = /(?:ate|ide|ium|ous|hcl|hbr|hydrate|sulfate|phosphate|tartrate|citrate|maleate|besylate|mesylate|bitartrate|hydrochloride|anhydrous)$/i

let saltSuffixes = sortLongestFirst([...DEFAULT_SALT_SUFFIXES])
let brandNames = sortLongestFirst([...DEFAULT_BRAND_NAMES])
let brandPattern = buildBrandPattern(brandNames)
let trailingSaltSuffixes = buildTrailingSaltPattern(saltSuffixes)

function sortLongestFirst(values) {
  return [...values].sort((a, b) => b.length - a.length)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildBrandPattern(names) {
  if (!names.length) return /(?!x)x/
  return new RegExp(
    `\\b(?:${names.map(escapeRegex).join('|')})\\b`,
    'i'
  )
}

function buildTrailingSaltPattern(salts) {
  if (!salts.length) return /(?!x)x$/
  return new RegExp(
    `\\s+(?:${salts.map(escapeRegex).join('|')})$`,
    'i'
  )
}

export function configurePillIdentity({ saltSuffixes: salts, brandNames: brands } = {}) {
  if (salts?.length) saltSuffixes = sortLongestFirst(salts)
  if (brands?.length) brandNames = sortLongestFirst(brands)
  brandPattern = buildBrandPattern(brandNames)
  trailingSaltSuffixes = buildTrailingSaltPattern(saltSuffixes)
}

export function getPharmaTerms() {
  return {
    saltSuffixes: [...saltSuffixes],
    brandNames: [...brandNames]
  }
}

export function isKnownSalt(term) {
  return saltSuffixes.includes(String(term).toLowerCase())
}

export function isKnownBrand(term) {
  return brandNames.includes(String(term).toLowerCase())
}

export function isPlausibleSalt(term) {
  const value = String(term).toLowerCase().trim()
  if (value.length < 3 || value.length > 40) return false
  return SALT_HEURISTIC.test(value)
}

export function discoverTermsFromPill(pill) {
  const brands = new Set()
  const salts = new Set()

  const aka = pill.genericName?.match(/also known as:\s*(.+)/i)
  if (aka) {
    for (const part of aka[1].split(/[,;]/)) {
      const brand = part.trim().toLowerCase()
      if (brand.length > 2 && !isKnownBrand(brand)) brands.add(brand)
    }
  }

  if (pill.name && pill.ingredients && !/\d+\s*mg/i.test(pill.name)) {
    const nameLower = pill.name.trim().toLowerCase()
    const ingredientLabel = formatIngredientLabel(pill).toLowerCase()
    if (
      nameLower.length > 2
      && !nameLower.includes('/')
      && !ingredientLabel.includes(nameLower)
      && !isKnownBrand(nameLower)
      && !/\b(bitartrate|acetaminophen|hydrocodone|ibuprofen|aspirin)\b/i.test(nameLower)
    ) {
      brands.add(nameLower)
    }
  }

  for (const source of [pill.ingredients, pill.genericName, pill.name]) {
    if (!source) continue
    for (const part of String(source).split(/,|\band\b|\//i)) {
      const words = part.trim().toLowerCase().split(/\s+/).filter(Boolean)
      if (words.length < 2) continue

      for (let len = 1; len <= 3 && len < words.length; len++) {
        const suffix = words.slice(-len).join(' ')
        if (!isKnownSalt(suffix) && isPlausibleSalt(suffix)) salts.add(suffix)
      }
    }
  }

  return {
    brands: [...brands],
    salts: [...salts]
  }
}

export function normalizeImprint(imprint) {
  if (!imprint) return ''
  return String(imprint).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function looksLikeBrandName(text) {
  const value = String(text || '')
  if (/\d+\s*mg/i.test(value)) return false
  if (/\b(bitartrate|acetaminophen|hydrocodone|ibuprofen|aspirin)\b/i.test(value)) return false
  return brandPattern.test(value)
}

function stripSaltForms(text) {
  let key = String(text).toLowerCase().replace(STRENGTH_PATTERN, '').trim()
  key = key.replace(COUNTER_ION_PREFIX, '')

  if (/\s/.test(key)) {
    let prev
    do {
      prev = key
      key = key.replace(trailingSaltSuffixes, '').trim()
    } while (key !== prev)
  }

  return key
}

function normalizeIngredientKey(text) {
  const key = stripSaltForms(text)
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim()

  const word = key.split(/\s+/).find(w => w.length > 2) || ''
  return word
}

function ingredientSources(pill) {
  const sources = []
  if (pill.ingredients) sources.push(pill.ingredients)
  if (pill.genericName && !looksLikeBrandName(pill.genericName)) sources.push(pill.genericName)
  if (pill.name && !looksLikeBrandName(pill.name)) sources.push(pill.name)
  return sources
}

export function parseIngredientKeys(...sources) {
  for (const source of sources) {
    if (!source || looksLikeBrandName(source)) continue

    const text = String(source)
    if (text.includes(',')) {
      const keys = text.split(',')
        .map(normalizeIngredientKey)
        .filter(key => key.length > 2)
      if (keys.length) return keys
    }

    const keys = text.split(/\s+and\s+|\//)
      .map(normalizeIngredientKey)
      .filter(key => key.length > 2)

    if (keys.length) return keys
  }

  return []
}

export function extractStrength(...sources) {
  for (const source of sources) {
    const match = String(source || '').match(STRENGTH_PATTERN)
    if (match) return match[1].replace(/\s+/g, '')
  }
  return ''
}

function titleWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function cleanupLabel(text) {
  return stripSaltForms(String(text))
    .replace(/[^a-z0-9\s/]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatIngredientLabel(pill) {
  const keys = parseIngredientKeys(...ingredientSources(pill))
  if (keys.length >= 2) return keys.map(titleWord).join(' / ')
  if (keys.length === 1) return titleWord(keys[0])

  const raw = pill.ingredients || (!looksLikeBrandName(pill.genericName) ? pill.genericName : '')
  return raw ? cleanupLabel(raw) : ''
}

export function getCanonicalPillId(pill) {
  const imprint = normalizeImprint(pill.physical?.imprint)
  if (imprint) return `imprint-${imprint}`

  const keys = [...new Set(parseIngredientKeys(...ingredientSources(pill)))].sort()
  if (keys.length) return `rx-${keys.join('-')}`

  if (pill.id) {
    const id = String(pill.id).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
    if (id) return id
  }

  const nameSlug = String(pill.name || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

  return `name-${nameSlug || 'unknown'}`
}

export function pickDisplayName(pill) {
  const ingredients = formatIngredientLabel(pill)
  const strength = extractStrength(pill.name, pill.dosage, pill.ingredients)
  if (ingredients && strength) return `${ingredients} ${strength}`
  if (ingredients) return ingredients
  return pill.name
}

function extractBrandNames(...sources) {
  const brands = new Set()

  for (const source of sources) {
    if (!source) continue
    const matches = String(source).match(new RegExp(brandPattern.source, 'gi'))
    if (matches) matches.forEach(m => brands.add(titleWord(m.toLowerCase())))
  }

  return [...brands]
}

export function pickGenericName(pill) {
  const brands = extractBrandNames(pill.name, pill.genericName)
  if (brands.length) return `Also known as: ${brands.join(', ')}`

  if (pill.genericName && pill.genericName !== pill.name && !looksLikeBrandName(pill.genericName)) {
    return cleanupLabel(pill.genericName)
  }

  return ''
}

export function normalizePill(pill) {
  if (!pill) return pill

  const id = getCanonicalPillId(pill)
  const name = pickDisplayName(pill)
  const genericName = pickGenericName(pill)

  return {
    ...pill,
    id,
    name,
    genericName,
    physical: {
      ...pill.physical,
      imprint: pill.physical?.imprint?.trim() || pill.physical?.imprint
    }
  }
}

function preferNonBrandName(...names) {
  const withStrength = names.find(name => name && extractStrength(name))
  if (withStrength && !looksLikeBrandName(withStrength)) return withStrength

  for (const name of names) {
    if (name && !looksLikeBrandName(name)) return name
  }
  return names.find(Boolean) || ''
}

export function mergePills(existing, incoming) {
  const longer = (a, b) => {
    if (!a) return b
    if (!b) return a
    return a.length >= b.length ? a : b
  }

  return normalizePill({
    ...existing,
    ...incoming,
    name: preferNonBrandName(incoming.name, existing.name),
    genericName: [existing.genericName, incoming.genericName, existing.name, incoming.name].filter(Boolean).join(' '),
    imageUrl: incoming.imageUrl || existing.imageUrl,
    confidence: Math.max(existing.confidence || 0, incoming.confidence || 0),
    summary: longer(existing.summary, incoming.summary),
    uses: longer(existing.uses, incoming.uses),
    dosage: incoming.dosage || existing.dosage,
    ingredients: incoming.ingredients || existing.ingredients,
    physical: { ...existing.physical, ...incoming.physical },
    sources: incoming.sources?.length ? incoming.sources : existing.sources
  })
}

export function dedupeCabinet(pills) {
  const byId = new Map()

  for (const pill of pills) {
    const normalized = normalizePill(pill)
    const existing = byId.get(normalized.id)
    byId.set(normalized.id, existing ? mergePills(existing, normalized) : normalized)
  }

  return [...byId.values()]
}

export function isPillInCabinet(cabinet, pill) {
  const id = getCanonicalPillId(pill)
  return cabinet.some(entry => entry.id === id)
}

export function findCabinetPill(cabinet, pill) {
  const id = getCanonicalPillId(pill)
  return cabinet.find(entry => entry.id === id) || null
}
