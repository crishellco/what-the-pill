<script setup>
import { useSupabaseUser } from '#imports'
import { isPillInCabinet, findCabinetPill } from '#shared/pillIdentity'

const inputMode = ref('imprint')
const imprintQuery = ref('')
const describeQuery = ref('')
const photoFile = ref(null)
const photoPreview = ref(null)
const tabLoading = reactive({ imprint: false, describe: false, photo: false })
const saveError = ref(null)

watch(photoFile, (file) => {
  if (!file) {
    photoPreview.value = null
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => { photoPreview.value = ev.target.result }
  reader.readAsDataURL(file)
})

const tabs = [
  { label: 'Imprint Code', icon: 'i-heroicons-magnifying-glass', value: 'imprint' },
  { label: 'Describe It', icon: 'i-heroicons-chat-bubble-left-ellipsis', value: 'describe' },
  { label: 'Photo', icon: 'i-heroicons-camera', value: 'photo' }
]

const tabTooltips = {
  imprint: 'Search by the letters or numbers imprinted on the pill',
  describe: 'Describe the pill\'s color, shape, size, and markings',
  photo: 'Take or upload a photo for visual identification'
}

function emptyTabState() {
  return { result: null, selectedId: null, error: null }
}

const tabState = reactive({
  imprint: emptyTabState(),
  describe: emptyTabState(),
  photo: emptyTabState()
})

const activeState = computed(() => tabState[inputMode.value])
const loading = computed(() => tabLoading[inputMode.value])

const identifyResult = computed(() => activeState.value.result)
const error = computed(() => activeState.value.error)

const selectedMatch = computed({
  get() {
    const state = activeState.value
    if (!state.result?.matches?.length) return null
    if (state.selectedId) {
      return state.result.matches.find(m => m.id === state.selectedId) || state.result.matches[0]
    }
    return state.result.matches[0]
  },
  set(match) {
    tabState[inputMode.value].selectedId = match?.id ?? null
  }
})

function clearCurrentTab() {
  if (inputMode.value === 'imprint') imprintQuery.value = ''
  if (inputMode.value === 'describe') describeQuery.value = ''
  if (inputMode.value === 'photo') {
    photoFile.value = null
    photoPreview.value = null
  }
  Object.assign(tabState[inputMode.value], emptyTabState())
  saveError.value = null
}

async function identify() {
  const mode = inputMode.value
  const state = tabState[mode]
  state.error = null
  state.result = null
  state.selectedId = null
  tabLoading[mode] = true

  try {
    let res
    if (inputMode.value === 'photo' && photoFile.value) {
      const formData = new FormData()
      formData.append('mode', 'photo')
      formData.append('photo', photoFile.value)
      res = await $fetch('/api/identify', { method: 'POST', body: formData })
    } else {
      const query = inputMode.value === 'imprint' ? imprintQuery.value : describeQuery.value
      res = await $fetch('/api/identify', {
        method: 'POST',
        body: { mode: inputMode.value, query }
      })
    }
    state.result = res
    state.selectedId = res.matches?.[0]?.id ?? null
  } catch (e) {
    state.error = e.data?.message || 'Something went wrong. Please try again.'
  } finally {
    tabLoading[mode] = false
  }
}

function canSubmit() {
  if (inputMode.value === 'imprint') return imprintQuery.value.trim().length > 0
  if (inputMode.value === 'describe') return describeQuery.value.trim().length > 0
  if (inputMode.value === 'photo') return !!photoFile.value
  return false
}

const { cabinet, addToCabinet, savingId } = useCabinet()
const user = useSupabaseUser()

const matches = computed(() => identifyResult.value?.matches || [])
const uploadedPhoto = computed(() =>
  identifyResult.value?.uploadedPhoto || (inputMode.value === 'photo' ? photoPreview.value : null)
)

const savedIds = computed(() => cabinet.value.map(p => p.id))

const alreadyAdded = computed(() =>
  selectedMatch.value && isPillInCabinet(cabinet.value, selectedMatch.value)
)

const cabinetMatch = computed(() =>
  selectedMatch.value ? findCabinetPill(cabinet.value, selectedMatch.value) : null
)

async function handleAddToCabinet(pill) {
  saveError.value = null
  try {
    const toSave = { ...pill }
    if (uploadedPhoto.value && !toSave.imageUrl) {
      toSave.imageUrl = uploadedPhoto.value
    }
    await addToCabinet(toSave)
  } catch (e) {
    saveError.value = e.message || 'Could not save pill.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-1">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Identify a Pill</h1>
      <p class="text-gray-500 text-sm">Use an imprint code, a photo, or describe what you see</p>
    </div>

    <UCard :ui="{ body: 'space-y-4' }">
      <UTabs
        v-model="inputMode"
        :items="tabs"
        :content="false"
        class="w-full"
      >
        <template #default="{ item }">
          <UTooltip :text="tabTooltips[item.value]">
            <span>{{ item.label }}</span>
          </UTooltip>
        </template>
      </UTabs>

      <UFormField
        v-if="inputMode === 'imprint'"
        label="Imprint code"
        help="Type the letters or numbers stamped on the pill"
      >
        <UInput
          v-model="imprintQuery"
          placeholder="e.g. L484, M366, 44 438"
          size="xl"
          class="w-full"
          :ui="{ root: 'w-full' }"
          autofocus
          @keyup.enter="canSubmit() && identify()"
        />
      </UFormField>

      <UFormField
        v-if="inputMode === 'describe'"
        label="Description"
        help="Color, shape, size, markings — anything you notice"
      >
        <UTextarea
          v-model="describeQuery"
          placeholder="e.g. round white pill, scored in half, about the size of an aspirin"
          :rows="4"
          class="w-full resize-none"
          :ui="{ root: 'w-full' }"
          autofocus
        />
      </UFormField>

      <UFormField
        v-if="inputMode === 'photo'"
        label="Photo"
        help="JPG, PNG up to 10MB"
      >
        <UFileUpload
          v-model="photoFile"
          accept="image/*"
          capture="environment"
          label="Tap to take a photo or upload"
          class="w-full"
        />
      </UFormField>

      <UTooltip text="Look up your pill using AI and public drug databases">
        <span class="block">
          <UButton
            block
            size="xl"
            :loading="loading"
            :disabled="!canSubmit()"
            @click="identify"
          >
            Identify Pill
          </UButton>
        </span>
      </UTooltip>
    </UCard>

    <UAlert v-if="error" color="error" :description="error" />
    <UAlert v-if="saveError" color="error" :description="saveError" />

    <template v-if="matches.length">
      <PillMatchList
        :matches="matches"
        :selected-id="selectedMatch?.id"
        :uploaded-photo="uploadedPhoto"
        :saved-ids="savedIds"
        @select="selectedMatch = $event"
        @clear="clearCurrentTab"
      />

      <PillResult
        v-if="selectedMatch"
        :result="selectedMatch"
        :already-added="alreadyAdded"
        :signed-in="!!user"
        :uploaded-photo="uploadedPhoto"
        :adding="savingId === (cabinetMatch?.id ?? selectedMatch.id)"
        @add="handleAddToCabinet(selectedMatch)"
      />
    </template>
  </div>
</template>
