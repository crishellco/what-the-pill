import { useSupabaseClient, useSupabaseUser, useSupabaseCookieRedirect, useState, navigateTo, useRoute } from '#imports'

const LOCAL_KEY = 'wtp-cabinet'

export function useCabinet() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const cabinet = useState('cabinet', () => [])
  const loading = useState('cabinet-loading', () => false)
  const ready = useState('cabinet-ready', () => false)

  async function fetchCabinet() {
    if (!user.value) {
      cabinet.value = []
      ready.value = true
      return
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('saved_pills')
        .select('pill_id, data, created_at')
        .order('created_at', { ascending: true })

      if (error) throw error
      cabinet.value = (data || []).map(row => row.data)
    } finally {
      loading.value = false
      ready.value = true
    }
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

    const rows = localPills.map(pill => ({
      user_id: user.value.id,
      pill_id: pill.id,
      data: pill
    }))

    await supabase
      .from('saved_pills')
      .upsert(rows, { onConflict: 'user_id,pill_id', ignoreDuplicates: true })

    localStorage.removeItem(LOCAL_KEY)
  }

  if (import.meta.client) {
    watch(user, async (current, previous) => {
      ready.value = false
      if (current?.id) {
        await migrateLocalStorage()
        await fetchCabinet()
      } else if (previous?.id) {
        cabinet.value = []
        ready.value = true
      } else {
        cabinet.value = []
        ready.value = true
      }
    }, { immediate: true })
  }

  async function addToCabinet(pill) {
    if (!user.value) {
      const redirect = useSupabaseCookieRedirect()
      redirect.path.value = useRoute().fullPath
      navigateTo('/login')
      return
    }

    if (cabinet.value.some(p => p.id === pill.id)) return

    const { error } = await supabase.from('saved_pills').insert({
      user_id: user.value.id,
      pill_id: pill.id,
      data: pill
    })

    if (error) {
      if (error.code === '23505') return
      throw error
    }

    cabinet.value = [...cabinet.value, pill]
  }

  async function removeFromCabinet(id) {
    if (!user.value) return

    const { error } = await supabase
      .from('saved_pills')
      .delete()
      .eq('pill_id', id)

    if (error) throw error
    cabinet.value = cabinet.value.filter(p => p.id !== id)
  }

  return { cabinet, loading, ready, addToCabinet, removeFromCabinet, fetchCabinet }
}
