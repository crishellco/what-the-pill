<script setup>
import { getCanonicalPillId } from '#shared/pillIdentity'

const props = defineProps({
  matches: { type: Array, required: true },
  selectedId: { type: String, default: null },
  uploadedPhoto: { type: String, default: null },
  savedIds: { type: Array, default: () => [] }
})
defineEmits(['select', 'clear'])

const confidenceColor = (score) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function isSaved(match) {
  return props.savedIds.includes(getCanonicalPillId(match))
}

function matchClasses(match) {
  const saved = isSaved(match)
  if (props.selectedId === match.id) {
    return saved
      ? 'border-green-500 bg-green-50 dark:bg-green-950/40 ring-1 ring-green-500/30'
      : 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 ring-1 ring-primary-500/30'
  }
  if (saved) {
    return 'border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
  }
  return 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Top matches <span class="font-normal text-gray-400">({{ matches.length }})</span>
      </p>
      <UTooltip text="Clear these results and start a new search on this tab">
        <UButton
          label="Clear"
          variant="link"
          color="neutral"
          size="sm"
          @click="$emit('clear')"
        />
      </UTooltip>
    </div>
    <div class="grid gap-2">
      <UTooltip
        v-for="match in matches"
        :key="match.id"
        :text="`View full details for ${match.name}`"
      >
        <button
          type="button"
          class="w-full min-w-0 flex items-start gap-2 sm:gap-3 p-3 rounded-xl border text-left transition-all overflow-hidden"
          :class="matchClasses(match)"
          @click="$emit('select', match)"
        >
        <PillImage
          :pill="match"
          :uploaded-photo="uploadedPhoto && match.id === matches[0]?.id ? uploadedPhoto : null"
          size="md"
        />
        <div class="flex-1 min-w-0 space-y-0.5">
          <div class="flex items-start justify-between gap-2">
            <p class="font-semibold text-gray-900 dark:text-white min-w-0 break-words leading-snug">
              {{ match.name }}
            </p>
            <UTooltip text="Estimated match likelihood — not a medical diagnosis">
              <span
                class="text-sm sm:text-lg font-bold shrink-0 tabular-nums"
                :class="confidenceColor(match.confidence)"
              >
                {{ match.confidence }}%
              </span>
            </UTooltip>
          </div>
          <p v-if="match.genericName && match.genericName !== match.name" class="text-xs text-gray-500 truncate">
            {{ match.genericName }}
          </p>
          <p v-if="match.physical?.imprint" class="text-xs text-gray-400 truncate">
            Imprint: {{ match.physical.imprint }}
          </p>
          <UBadge
            v-if="isSaved(match)"
            color="success"
            variant="subtle"
            size="sm"
            icon="i-heroicons-check-circle-solid"
            label="In Cabinet"
          />
        </div>
        </button>
      </UTooltip>
    </div>
  </div>
</template>
