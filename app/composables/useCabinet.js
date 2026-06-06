import { useSupabaseClient, useSupabaseUser, useSupabaseCookieRedirect, useState, navigateTo, useRoute } from '#imports'
import { normalizePill, dedupeCabinet, mergePills, findCabinetPill } from '#shared/pillIdentity'

const LOCAL_KEY = 'wtp-cabinet'

function getUserId(user) {
  return user?.sub ?? user?.id ?? null
}

let inflightFetch = null

async function migrateCabinetIds(supabase, userId, rows) {
  if (!userId || !rows.length) return

  const stale = rows
    .map(row => ({ row, pill: normalizePill(row.data) }))
    .filter(({ row, pill }) => row.pill_id !== pill.id)

  if (!stale.length) return

  for (const { row, pill } of stale) {
    await supabase
      .from('saved_pills')
      .upsert({
        user_id: userId,
        pill_id: pill.id,
        data: pill
      }, { onConflict: 'user_id,pill_id' })

    await supabase
      .from('saved_pills')
      .delete()
      .eq('user_id', userId)
      .eq('pill_id', row.pill_id)
  }
}

export function useCabinet() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const cabinet = useState('cabinet', () => [])
  const loading = useState('cabinet-loading', () => false)
  const ready = useState('cabinet-ready', () => false)
  const loadedForUser = useState('cabinet-loaded-for-user', () => null)
  const watcherStarted = useState('cabinet-watcher-started', () => false)
  const savingId = useState('cabinet-saving-id', () => null)
  const removingId = useState('cabinet-removing-id', () => null)

  async function fetchCabinet() {
    const userId = getUserId(user.value)
    if (!userId) {
      cabinet.value = []
      ready.value = true
      loadedForUser.value = null
      return
    }

    if (loadedForUser.value === userId && ready.value) return

    if (inflightFetch) {
      await inflightFetch
      return
    }

    loading.value = true
    inflightFetch = (async () => {
      try {
        const { data, error } = await supabase
          .from('saved_pills')
          .select('pill_id, data, created_at')
          .order('created_at', { ascending: true })

        if (error) throw error

        const rows = data || []
        cabinet.value = dedupeCabinet(rows.map(row => normalizePill(row.data)))
        await migrateCabinetIds(supabase, userId, rows)
        loadedForUser.value = userId
      } finally {
        loading.value = false
        ready.value = true
        inflightFetch = null
      }
    })()

    await inflightFetch
  }

  async function migrateLocalStorage() {
    if (!import.meta.client || !user.value) return

    const stored = localStorage.getItem(LOCAL_KEY)
    if (!stored) return

    let localPills
    try {
      localPills = JSON.parse(stored)
    } catch {
      localStorage.removeItem(LOCAL_KEY)
      return
    }

    if (!localPills.length) {
      localStorage.removeItem(LOCAL_KEY)
      return
    }

    const rows = localPills.map(pill => {
      const normalized = normalizePill(pill)
      return {
        user_id: getUserId(user.value),
        pill_id: normalized.id,
        data: normalized
      }
    })

    await supabase
      .from('saved_pills')
      .upsert(rows, { onConflict: 'user_id,pill_id', ignoreDuplicates: true })

    localStorage.removeItem(LOCAL_KEY)
  }

  async function syncCabinet() {
    const userId = getUserId(user.value)
    if (!userId) {
      cabinet.value = []
      loadedForUser.value = null
      ready.value = true
      return
    }
    if (loadedForUser.value === userId && ready.value) return

    await migrateLocalStorage()
    await fetchCabinet()
  }

  if (import.meta.client && !watcherStarted.value) {
    watcherStarted.value = true
    watch(
      () => getUserId(user.value),
      (userId, prevId) => {
        if (userId && userId === prevId && ready.value) return
        if (userId) {
          syncCabinet()
        } else if (prevId) {
          cabinet.value = []
          loadedForUser.value = null
          ready.value = true
        } else if (!ready.value) {
          ready.value = true
        }
      },
      { immediate: true }
    )
  }

  async function addToCabinet(pill) {
    if (!user.value) {
      const redirect = useSupabaseCookieRedirect()
      redirect.path.value = useRoute().fullPath
      navigateTo('/login')
      return
    }

    const normalized = normalizePill(pill)
    const existing = findCabinetPill(cabinet.value, normalized)

    if (existing) {
      const merged = mergePills(existing, normalized)
      if (JSON.stringify(merged) === JSON.stringify(existing)) return

      savingId.value = normalized.id
      try {
        const { error } = await supabase
          .from('saved_pills')
          .update({ data: merged })
          .eq('pill_id', existing.id)

        if (error) throw error
        cabinet.value = cabinet.value.map(p => (p.id === existing.id ? merged : p))
      } finally {
        savingId.value = null
      }
      return
    }

    savingId.value = normalized.id
    try {
      const { error } = await supabase.from('saved_pills').insert({
        user_id: getUserId(user.value),
        pill_id: normalized.id,
        data: normalized
      })

      if (error) {
        if (error.code === '23505') return
        throw error
      }

      cabinet.value = [...cabinet.value, normalized]
    } finally {
      savingId.value = null
    }
  }

  async function removeFromCabinet(id) {
    if (!user.value) return

    removingId.value = id
    try {
      const { error } = await supabase
        .from('saved_pills')
        .delete()
        .eq('pill_id', id)

      if (error) throw error
      cabinet.value = cabinet.value.filter(p => p.id !== id)
    } finally {
      removingId.value = null
    }
  }

  return { cabinet, loading, ready, savingId, removingId, addToCabinet, removeFromCabinet, fetchCabinet: syncCabinet }
}
