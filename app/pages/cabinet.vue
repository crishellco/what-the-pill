<script setup>
const { cabinet, removeFromCabinet } = useCabinet()

const loading = ref(false)
const interactions = ref(null)
const error = ref(null)

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
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Pills</h1>
      <UBadge v-if="cabinet.length" :label="`${cabinet.length} pill${cabinet.length > 1 ? 's' : ''}`" />
    </div>

    <div v-if="cabinet.length === 0" class="text-center py-16 text-gray-400 space-y-2">
      <UIcon name="i-heroicons-archive-box" class="w-12 h-12 mx-auto" />
      <p class="text-sm">No pills saved yet. Identify a pill and tap "Add to My Pills".</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="pill in cabinet"
        :key="pill.id"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start gap-3"
      >
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 dark:text-white">{{ pill.name }}</p>
          <p class="text-sm text-gray-500 truncate">{{ pill.summary }}</p>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="removeFromCabinet(pill.id)"
        />
      </div>

      <UButton
        v-if="cabinet.length >= 2"
        block
        color="warning"
        :loading="loading"
        icon="i-heroicons-exclamation-triangle"
        @click="checkInteractions"
      >
        Check Interactions
      </UButton>
      <p v-else class="text-xs text-center text-gray-400">Add at least 2 pills to check interactions</p>
    </div>

    <UAlert v-if="error" color="error" :description="error" />

    <InteractionResult v-if="interactions" :data="interactions" />
  </div>
</template>
