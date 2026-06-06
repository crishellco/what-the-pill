import { DEFAULT_SALT_SUFFIXES, DEFAULT_BRAND_NAMES } from '#shared/pharmaDefaults'
import {
  configurePillIdentity,
  discoverTermsFromPill,
} from '#shared/pillIdentity'
import { useSupabaseAdmin } from './supabaseAdmin.js'

const TERMS_CACHE_TTL_MS = 5 * 60 * 1000
let cachedTerms = null
let cachedAt = 0

function normalizeTerm(value) {
  return String(value || '').trim().toLowerCase()
}

export async function loadPharmaTerms({ force = false } = {}) {
  if (!force && cachedTerms && Date.now() - cachedAt < TERMS_CACHE_TTL_MS) {
    return cachedTerms
  }

  const supabase = useSupabaseAdmin()
  if (!supabase) {
    cachedTerms = {
      saltSuffixes: [...DEFAULT_SALT_SUFFIXES],
      brandNames: [...DEFAULT_BRAND_NAMES]
    }
    cachedAt = Date.now()
    configurePillIdentity(cachedTerms)
    return cachedTerms
  }

  const { data, error } = await supabase
    .from('pharma_terms')
    .select('kind, value')

  if (error || !data?.length) {
    cachedTerms = {
      saltSuffixes: [...DEFAULT_SALT_SUFFIXES],
      brandNames: [...DEFAULT_BRAND_NAMES]
    }
  } else {
    cachedTerms = {
      saltSuffixes: data.filter(row => row.kind === 'salt').map(row => row.value),
      brandNames: data.filter(row => row.kind === 'brand').map(row => row.value)
    }
  }

  cachedAt = Date.now()
  configurePillIdentity(cachedTerms)
  return cachedTerms
}

export async function seedPharmaTermsIfEmpty() {
  const supabase = useSupabaseAdmin()
  if (!supabase) return

  const { count, error } = await supabase
    .from('pharma_terms')
    .select('*', { count: 'exact', head: true })

  if (error || count > 0) return

  const rows = [
    ...DEFAULT_SALT_SUFFIXES.map(value => ({ kind: 'salt', value, source: 'seed' })),
    ...DEFAULT_BRAND_NAMES.map(value => ({ kind: 'brand', value, source: 'seed' }))
  ]

  await supabase.from('pharma_terms').insert(rows)
}

export async function upsertPharmaTerms({ salts = [], brands = [] }) {
  const supabase = useSupabaseAdmin()
  if (!supabase) return false

  const rows = [
    ...salts.map(value => ({ kind: 'salt', value: normalizeTerm(value), source: 'discovered' })),
    ...brands.map(value => ({ kind: 'brand', value: normalizeTerm(value), source: 'discovered' }))
  ].filter(row => row.value.length > 2)

  if (!rows.length) return false

  const { error } = await supabase
    .from('pharma_terms')
    .upsert(rows, { onConflict: 'kind,value', ignoreDuplicates: true })

  if (error) {
    console.error('Failed to upsert pharma terms:', error.message)
    return false
  }

  cachedAt = 0
  await loadPharmaTerms({ force: true })
  return true
}

export async function discoverAndSaveTerms(matches = []) {
  const salts = new Set()
  const brands = new Set()

  for (const match of matches) {
    const found = discoverTermsFromPill(match)
    found.salts.forEach(value => salts.add(value))
    found.brands.forEach(value => brands.add(value))
  }

  if (!salts.size && !brands.size) return false

  return upsertPharmaTerms({
    salts: [...salts],
    brands: [...brands]
  })
}
