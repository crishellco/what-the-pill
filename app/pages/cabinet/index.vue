<script setup>
import { useSupabaseUser } from '#imports'

import { pillMatchesQuery } from '~/utils/cabinetSearch'

useSiteSeo({
  title: 'My Pill Cabinet',
  description: 'View saved medications, check interactions, and manage your personal pill cabinet.',
  noindex: true,
})

const { cabinet, removeFromCabinet, loading: cabinetLoading, ready, removingId } = useCabinet()
const user = useSupabaseUser()
const { confirm } = useConfirm()

const search = ref('')
const loading = ref(false)
const interactions = ref(null)
const error = ref(null)

const filteredCabinet = computed(() => {
  if (!search.value.trim()) return cabinet.value
  return cabinet.value.filter(pill => pillMatchesQuery(pill, search.value))
})

async function handleRemove(pill) {
  const ok = await confirm({
    title: 'Remove from cabinet?',
    message: `Remove ${pill.name} from your cabinet? This cannot be undone.`,
    confirmLabel: 'Remove',
    destructive: true
  })
  if (!ok) return
  await removeFromCabinet(pill.id)
}

async function checkInteractions() {
  if (cabinet.value.length < 2) return
  loading.value = true
  error.value = null
  interactions.value = null
  try {
    const res = await $fetch('/api/interact', {
      method: 'POST',
      body: { pills: cabinet.value.map(p => p.name) }
    })
    interactions.value = res
  } catch (e) {
    error.value = e.data?.message || 'Could not check interactions.'
  } finally {
    loading.value = false
  }
}

function pillPath(id) {
  return `/cabinet/${encodeURIComponent(id)}`
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Cabinet</h1>

    <div aria-live="polite" aria-atomic="true">
    </div>
    <div v-if="!ready || cabinetLoading" class="text-center py-16 space-y-3">
      <USkeleton class="h-8 w-8 rounded-full mx-auto" />
      <p class="text-sm text-gray-400">Loading your pills…</p>
    </div>

    <div v-else-if="cabinet.length === 0" class="text-center py-16 space-y-3">
      <UIcon name="i-heroicons-archive-box" class="w-12 h-12 mx-auto text-gray-400" />
      <p class="text-sm text-gray-400">No pills saved yet. Identify a pill and tap "Add to Cabinet".</p>
      <p v-if="user" class="text-xs text-gray-400">Signed in as {{ user.email }}</p>
    </div>

    <div v-else class="space-y-3">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search brand, generic name, or ingredients"
        size="lg"
        class="w-full"
        :ui="{ root: 'w-full' }"
      />

      <p v-if="search.trim() && !filteredCabinet.length" class="text-sm text-center text-gray-400 py-8">
        No pills match "{{ search.trim() }}"
      </p>

      <UCard
        v-for="pill in filteredCabinet"
        :key="pill.id"
        class="relative"
        :ui="{ body: 'p-0 sm:p-0' }"
      >
        <ULink :to="pillPath(pill.id)" class="flex items-center gap-3 p-4 pr-12">
          <PillImage :pill="pill" size="sm" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-900 dark:text-white truncate">{{ pill.name }}</p>
            <p class="text-sm text-gray-500 truncate">{{ pill.summary }}</p>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400 shrink-0" />
        </ULink>
        <UTooltip text="Remove from cabinet">
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="sm"
            class="absolute top-3 right-3"
            aria-label="Remove from cabinet"
            :loading="removingId === pill.id"
            :disabled="!!removingId"
            @click.stop.prevent="handleRemove(pill)"
          />
        </UTooltip>
      </UCard>

      <template v-if="cabinet.length >= 2">
        <UTooltip text="Screen saved pills for known drug interactions — not a substitute for a pharmacist or doctor">
          <UButton
            block
            color="warning"
            :loading="loading"
            icon="i-heroicons-exclamation-triangle"
            @click="checkInteractions"
          >
            Check Interactions
          </UButton>
        </UTooltip>
      </template>
      <p v-else class="text-xs text-center text-gray-400">Save at least 2 pills to check for interactions</p>
    </div>

    <UAlert v-if="error" color="error" :description="error" />

    <InteractionResult v-if="interactions" :data="interactions" />
  </div>
</template>
