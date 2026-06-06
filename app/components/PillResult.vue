<script setup>
defineProps({
  result: { type: Object, required: true },
  alreadyAdded: { type: Boolean, default: false },
  signedIn: { type: Boolean, default: false }
})
defineEmits(['add'])

const severityColor = { low: 'success', moderate: 'warning', high: 'error' }

const confidenceColor = (score) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden space-y-0">
    <!-- Header -->
    <div class="p-5 border-b border-gray-100 dark:border-gray-800">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ result.name }}</h2>
          <p v-if="result.genericName && result.genericName !== result.name" class="text-sm text-gray-500">{{ result.genericName }}</p>
        </div>
        <div class="text-right shrink-0">
          <span class="text-2xl font-bold" :class="confidenceColor(result.confidence)">{{ result.confidence }}%</span>
          <p class="text-xs text-gray-400">confidence</p>
        </div>
      </div>

      <!-- Physical match chips -->
      <div v-if="result.physical" class="flex flex-wrap gap-1.5 mt-3">
        <span
          v-for="(val, key) in result.physical"
          :key="key"
          class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize"
        >
          {{ key }}: {{ val }}
        </span>
      </div>
    </div>

    <!-- Plain-language summary -->
    <div class="p-5 space-y-4">
      <div>
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">What it is</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ result.summary }}</p>
      </div>

      <div v-if="result.uses">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Used for</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ result.uses }}</p>
      </div>

      <div v-if="result.dosage">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Typical dose</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ result.dosage }}</p>
      </div>

      <!-- Safety note -->
      <div v-if="result.safetyNote" class="rounded-xl p-4 space-y-1" :class="result.safetyLevel === 'high' ? 'bg-red-50 dark:bg-red-950' : result.safetyLevel === 'moderate' ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'">
        <p class="text-sm font-semibold" :class="result.safetyLevel === 'high' ? 'text-red-700 dark:text-red-300' : result.safetyLevel === 'moderate' ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'">
          Should I be worried?
        </p>
        <p class="text-sm" :class="result.safetyLevel === 'high' ? 'text-red-600 dark:text-red-400' : result.safetyLevel === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'">
          {{ result.safetyNote }}
        </p>
      </div>

      <!-- Sources -->
      <div v-if="result.sources?.length" class="pt-1">
        <p class="text-xs text-gray-400 mb-1">Sources checked</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="src in result.sources"
            :key="src.name"
            class="text-xs px-2 py-0.5 rounded-full border"
            :class="src.found ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400' : 'border-gray-200 text-gray-400 dark:border-gray-700'"
          >
            {{ src.found ? '✓' : '–' }} {{ src.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add to cabinet -->
    <div class="p-5 pt-0">
      <UButton
        block
        :disabled="alreadyAdded"
        :color="alreadyAdded ? 'neutral' : 'primary'"
        :variant="alreadyAdded ? 'outline' : 'solid'"
        :icon="alreadyAdded ? 'i-heroicons-check' : 'i-heroicons-plus'"
        @click="$emit('add')"
      >
        {{ alreadyAdded ? 'Added to My Pills' : signedIn ? 'Add to My Pills' : 'Sign in to save' }}
      </UButton>
      <p v-if="!signedIn && !alreadyAdded" class="text-xs text-center text-gray-400 mt-2">
        Google sign-in required to save pills
      </p>
    </div>
  </div>
</template>
