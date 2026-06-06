<script setup>
defineProps({
  data: { type: Object, required: true }
})

const severityColor = {
  minor: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  moderate: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  serious: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
}
</script>

<template>
  <div class="space-y-3">
    <h2 class="font-semibold text-gray-900 dark:text-white">Interaction Check</h2>

    <div v-if="!data.interactions?.length" class="bg-green-50 dark:bg-green-950 rounded-xl p-4 border border-green-200 dark:border-green-800">
      <p class="text-sm font-semibold text-green-700 dark:text-green-300">No known interactions found</p>
      <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ data.summary }}</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(item, i) in data.interactions"
        :key="i"
        class="rounded-xl p-4 border space-y-1"
        :class="severityColor[item.severity] || severityColor.moderate"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">{{ item.drugs.join(' + ') }}</p>
          <span class="text-xs font-medium uppercase tracking-wide opacity-70">{{ item.severity }}</span>
        </div>
        <p class="text-sm leading-relaxed">{{ item.description }}</p>
      </div>
    </div>

    <p class="text-xs text-gray-400">This is not medical advice. Always consult a pharmacist or physician.</p>
  </div>
</template>
