<script setup>
import { useSupabaseUser } from '#imports'
import { isPillInCabinet, findCabinetPill } from '#shared/pillIdentity'

useSiteSeo({
  title: 'Identify Pills',
  description:
    'Identify pills by photo, imprint code, or description. Check drug interactions and save matches to your cabinet.',
})

const inputMode = ref('imprint')
const imprintQuery = ref('')
const describeQuery = ref('')
const photoSide1 = ref(null)
const photoSide2 = ref(null)
const photoPreviewSide1 = ref(null)
const photoPreviewSide2 = ref(null)
const tabLoading = reactive({ imprint: false, describe: false, photo: false })
const saveError = ref(null)

function readPhotoPreview(file, previewRef) {
  if (!file) {
    previewRef.value = null
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => { previewRef.value = ev.target.result }
  reader.readAsDataURL(file)
}

watch(photoSide1, (file) => readPhotoPreview(file, photoPreviewSide1))
watch(photoSide2, (file) => readPhotoPreview(file, photoPreviewSide2))

const tabs = [
  { label: 'Imprint Code', icon: 'i-lucide-stamp', value: 'imprint' },
  { label: 'Describe It', icon: 'i-heroicons-magnifying-glass', value: 'describe' },
  { label: 'Photo', icon: 'i-heroicons-camera', value: 'photo' },
]

const tabTooltips = {
  imprint: 'Search by the letters or numbers imprinted on the pill',
  describe: 'Describe the pill\'s color, shape, size, and markings',
  photo: 'Take or upload a photo of each side of the pill for best results'
}

const photoUploadUi = {
  root: 'w-full',
  base: 'aspect-[4/5] w-full relative rounded-lg',
  fileLeadingAvatar: 'size-full rounded-lg object-contain bg-white dark:bg-gray-950',
  fileTrailingButton: 'absolute top-2 end-2 z-10 p-0 rounded-full border-2 border-bg shadow-sm'
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
    photoSide1.value = null
    photoSide2.value = null
    photoPreviewSide1.value = null
    photoPreviewSide2.value = null
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
    if (inputMode.value === 'photo' && (photoSide1.value || photoSide2.value)) {
      const formData = new FormData()
      formData.append('mode', 'photo')
      if (photoSide1.value) formData.append('photo', photoSide1.value)
      if (photoSide2.value) formData.append('photoSide2', photoSide2.value)
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
  if (inputMode.value === 'photo') return !!(photoSide1.value || photoSide2.value)
  return false
}

const { cabinet, addToCabinet, savingId } = useCabinet()
const user = useSupabaseUser()

const matches = computed(() => identifyResult.value?.matches || [])
const photoDescription = computed(() => identifyResult.value?.photoDescription || null)
const uploadedPhoto = computed(() =>
  identifyResult.value?.uploadedPhoto || (inputMode.value === 'photo' ? photoPreviewSide1.value : null)
)
const uploadedPhotoSide2 = computed(() =>
  identifyResult.value?.uploadedPhotoSide2 || (inputMode.value === 'photo' ? photoPreviewSide2.value : null)
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
    if (uploadedPhotoSide2.value && !toSave.imageUrlSide2) {
      toSave.imageUrlSide2 = uploadedPhotoSide2.value
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
      <p class="text-gray-500 text-sm">Use an imprint code, photos of each side, or describe what you see</p>
    </div>

    <UCard :ui="{ body: 'space-y-4' }">
      <UTabs
        v-model="inputMode"
        :items="tabs"
        :content="false"
        class="w-full"
        aria-label="Pill identification method"
        :ui="{
          list: 'grid grid-cols-3 w-full',
          trigger: 'flex items-center justify-center gap-0 sm:gap-2 leading-none px-2 sm:px-4 py-2.5 min-h-10',
          leadingIcon: 'size-5 shrink-0 leading-none',
          label: 'hidden sm:inline truncate leading-none',
        }"
      >
        <template #leading="{ item }">
          <UTooltip :text="tabTooltips[item.value]">
            <span class="inline-flex items-center leading-none">
              <UIcon :name="item.icon" class="size-5 shrink-0 leading-none" aria-hidden="true" />
            </span>
          </UTooltip>
        </template>
        <template #default="{ item }">
          <span class="leading-none">{{ item.label }}</span>
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

      <div v-if="inputMode === 'photo'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <UFormField
          label="Side 1"
          help="JPG or PNG, up to 10MB"
          class="min-w-0"
        >
          <UFileUpload
            v-model="photoSide1"
            layout="grid"
            position="inside"
            accept="image/*"
            capture="environment"
            label="Upload or photograph one side"
            class="w-full"
            :ui="photoUploadUi"
          />
        </UFormField>
        <UFormField
          label="Side 2"
          help="Optional — helps read both sides of the pill"
          class="min-w-0"
        >
          <UFileUpload
            v-model="photoSide2"
            layout="grid"
            position="inside"
            accept="image/*"
            capture="environment"
            label="Upload or photograph the other side"
            class="w-full"
            :ui="photoUploadUi"
          />
        </UFormField>
      </div>

      <UTooltip text="Search the pill reference database by imprint, description, or photo">
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

    <div aria-live="polite" aria-atomic="true" class="space-y-3">
      <UAlert v-if="error" color="error" :description="error" />
      <UAlert v-if="saveError" color="error" :description="saveError" />
    </div>

    <template v-if="matches.length">
      <UAlert
        v-if="photoDescription && inputMode === 'photo'"
        color="neutral"
        variant="subtle"
        icon="i-heroicons-eye"
        title="Read from your photos"
        :description="photoDescription"
      />

      <PillMatchList
        :matches="matches"
        :selected-id="selectedMatch?.id"
        :uploaded-photo="uploadedPhoto"
        :uploaded-photo-side2="uploadedPhotoSide2"
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
        :uploaded-photo-side2="uploadedPhotoSide2"
        :adding="savingId === (cabinetMatch?.id ?? selectedMatch.id)"
        @add="handleAddToCabinet(selectedMatch)"
      />
    </template>
  </div>
</template>
