<script setup>
const inputMode = ref('imprint') // 'imprint' | 'describe' | 'photo'
const imprintQuery = ref('')
const describeQuery = ref('')
const photoFile = ref(null)
const photoPreview = ref(null)
const loading = ref(false)
const result = ref(null)
const error = ref(null)

const fileInput = ref(null)

const tabs = [
  { key: 'imprint', label: 'Imprint Code', icon: 'i-heroicons-magnifying-glass' },
  { key: 'describe', label: 'Describe It', icon: 'i-heroicons-chat-bubble-left-ellipsis' },
  { key: 'photo', label: 'Photo', icon: 'i-heroicons-camera' }
]

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  photoFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { photoPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

async function identify() {
  error.value = null
  result.value = null
  loading.value = true

  try {
    let body

    if (inputMode.value === 'photo' && photoFile.value) {
      const formData = new FormData()
      formData.append('mode', 'photo')
      formData.append('photo', photoFile.value)
      const res = await $fetch('/api/identify', { method: 'POST', body: formData })
      result.value = res
    } else {
      const query = inputMode.value === 'imprint' ? imprintQuery.value : describeQuery.value
      const res = await $fetch('/api/identify', {
        method: 'POST',
        body: { mode: inputMode.value, query }
      })
      result.value = res
    }
  } catch (e) {
    error.value = e.data?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

function canSubmit() {
  if (inputMode.value === 'imprint') return imprintQuery.value.trim().length > 0
  if (inputMode.value === 'describe') return describeQuery.value.trim().length > 0
  if (inputMode.value === 'photo') return !!photoFile.value
  return false
}

const { cabinet, addToCabinet } = useCabinet()
const user = useSupabaseUser()
const alreadyAdded = computed(() =>
  result.value && cabinet.value.some(p => p.id === result.value.id)
)
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-1">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Identify a Pill</h1>
      <p class="text-gray-500 text-sm">Use an imprint code, a photo, or describe what you see</p>
    </div>

    <!-- Input mode tabs -->
    <div class="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all"
        :class="inputMode === tab.key
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="inputMode = tab.key; result = null; error = null"
      >
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Imprint input -->
    <div v-if="inputMode === 'imprint'" class="space-y-3">
      <UInput
        v-model="imprintQuery"
        placeholder="e.g. L484, M366, 44 438"
        size="xl"
        autofocus
        @keyup.enter="canSubmit() && identify()"
      />
      <p class="text-xs text-gray-400">Type the letters or numbers stamped on the pill</p>
    </div>

    <!-- Describe input -->
    <div v-if="inputMode === 'describe'" class="space-y-3">
      <UTextarea
        v-model="describeQuery"
        placeholder="e.g. round white pill, scored in half, about the size of an aspirin"
        :rows="3"
        autofocus
      />
    </div>

    <!-- Photo input -->
    <div v-if="inputMode === 'photo'" class="space-y-3">
      <div
        class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
        @click="fileInput.click()"
      >
        <template v-if="photoPreview">
          <img :src="photoPreview" class="max-h-48 mx-auto rounded-lg object-contain" />
          <p class="text-xs text-gray-400 mt-2">Tap to change</p>
        </template>
        <template v-else>
          <UIcon name="i-heroicons-camera" class="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p class="text-sm text-gray-500">Tap to take a photo or upload</p>
          <p class="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
        </template>
      </div>
      <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFileChange" />
    </div>

    <UButton
      block
      size="xl"
      :loading="loading"
      :disabled="!canSubmit()"
      @click="identify"
    >
      Identify Pill
    </UButton>

    <!-- Error -->
    <UAlert v-if="error" color="error" :description="error" />

    <!-- Result -->
    <PillResult
      v-if="result"
      :result="result"
      :already-added="alreadyAdded"
      :signed-in="!!user"
      @add="addToCabinet(result)"
    />
  </div>
</template>
