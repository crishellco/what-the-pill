<script setup>
defineProps({
  data: { type: Object, required: true }
})

const severityColor = {
  minor: 'info',
  moderate: 'warning',
  serious: 'error'
}
</script>

<template>
  <div class="space-y-3">
    <h2 class="font-semibold text-gray-900 dark:text-white">Interaction Check</h2>

    <UAlert
      v-if="!data.interactions?.length"
      color="success"
      variant="subtle"
      icon="i-heroicons-check-circle"
      title="No known interactions found"
      :description="data.summary"
    />

    <div v-else class="space-y-2">
      <UAlert
        v-for="(item, i) in data.interactions"
        :key="i"
        :color="severityColor[item.severity] || 'warning'"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        :description="item.description"
      >
        <template #title>
          <div class="flex items-center justify-between gap-2">
            <span>{{ item.drugs.join(' + ') }}</span>
            <UBadge color="neutral" variant="subtle" size="sm" :label="item.severity" class="uppercase" />
          </div>
        </template>
      </UAlert>
    </div>

    <p class="text-xs text-gray-400">This is not medical advice. Always consult a pharmacist or physician.</p>
  </div>
</template>
