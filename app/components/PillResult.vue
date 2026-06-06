<script setup>
const props = defineProps({
  result: { type: Object, required: true },
  alreadyAdded: { type: Boolean, default: false },
  signedIn: { type: Boolean, default: false },
  showAdd: { type: Boolean, default: true },
  uploadedPhoto: { type: String, default: null },
  adding: { type: Boolean, default: false }
})
defineEmits(['add'])

const cabinetPath = computed(() => `/cabinet/${encodeURIComponent(props.result.id)}`)

const confidenceColor = (score) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const safetyAlertColor = computed(() => {
  if (props.result.safetyLevel === 'high') return 'error'
  if (props.result.safetyLevel === 'moderate') return 'warning'
  return 'success'
})
</script>

<template>
  <div>
    <UCard :ui="{ body: 'p-0 sm:p-0 divide-y divide-gray-100 dark:divide-gray-800' }">
      <UAlert
        v-if="alreadyAdded && showAdd"
        color="success"
        variant="subtle"
        icon="i-heroicons-check-circle-solid"
        title="Already in your cabinet"
        orientation="horizontal"
        class="rounded-none border-0"
      >
        <template #actions>
          <UTooltip text="Open this saved pill in your cabinet">
            <UButton label="View" :to="cabinetPath" size="sm" />
          </UTooltip>
        </template>
      </UAlert>

      <div class="p-4 sm:p-5">
        <div class="flex items-start gap-3 sm:gap-4 min-w-0">
          <PillImage :pill="result" :uploaded-photo="uploadedPhoto" size="lg" />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words leading-snug">
                  {{ result.name }}
                </h2>
                <p v-if="result.genericName && result.genericName !== result.name" class="text-sm text-gray-500 break-words">
                  {{ result.genericName }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <UTooltip text="Estimated match likelihood — not a medical diagnosis">
                  <span class="text-lg sm:text-2xl font-bold tabular-nums" :class="confidenceColor(result.confidence)">{{ result.confidence }}%</span>
                </UTooltip>
                <p class="text-xs text-gray-400">confidence</p>
              </div>
            </div>
            <div v-if="result.physical" class="flex flex-wrap gap-1.5 mt-3">
              <UBadge
                v-for="(val, key) in result.physical"
                :key="key"
                color="neutral"
                variant="subtle"
                size="sm"
                :label="`${key}: ${val}`"
                class="capitalize"
              />
            </div>
          </div>
        </div>
      </div>

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

        <UAlert
          v-if="result.safetyNote"
          :color="safetyAlertColor"
          variant="subtle"
          title="Should I be worried?"
          :description="result.safetyNote"
        />

        <div v-if="result.sources?.length">
          <p class="text-xs text-gray-400 mb-1">Sources checked</p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="src in result.sources"
              :key="src.name"
              :color="src.found ? 'success' : 'neutral'"
              variant="outline"
              size="sm"
              :label="`${src.found ? '✓' : '–'} ${src.name}`"
            />
          </div>
        </div>
      </div>
    </UCard>

    <div v-if="showAdd" aria-hidden="true" class="h-24" />

    <Teleport to="body">
      <div
        v-if="showAdd"
        class="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
        style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
      >
        <UContainer class="max-w-2xl pt-3">
          <UTooltip
            v-if="alreadyAdded"
            text="Open this saved pill in your cabinet"
          >
            <ULink :to="cabinetPath" class="block">
              <UButton
                block
                size="lg"
                color="success"
                variant="soft"
                icon="i-heroicons-check-circle-solid"
              >
                View in Cabinet
              </UButton>
            </ULink>
          </UTooltip>
          <UTooltip
            v-else
            :text="signedIn
              ? 'Save this pill to your cabinet for later reference and interaction checks'
              : 'Sign in with a free account to save pills — identification stays free'"
          >
            <UButton
              block
              size="lg"
              :disabled="adding"
              :loading="adding"
              color="primary"
              icon="i-heroicons-plus"
              @click="$emit('add')"
            >
              {{ signedIn ? 'Add to Cabinet' : 'Sign in to save' }}
            </UButton>
          </UTooltip>
          <p v-if="!signedIn && !alreadyAdded" class="text-xs text-center text-gray-400 mt-2">
            Sign in with email to save pills
          </p>
        </UContainer>
      </div>
    </Teleport>
  </div>
</template>
