<script setup>
import { pillColorStyle, pillShapeClass } from '~/utils/pillVisual'

const props = defineProps({
  pill: { type: Object, default: null },
  imageUrl: { type: String, default: null },
  uploadedPhoto: { type: String, default: null },
  size: { type: String, default: 'md' },
  zoomable: { type: Boolean, default: true },
})

const sizeClass = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14 sm:w-20 sm:h-20',
  lg: 'w-16 h-16 sm:w-28 sm:h-28',
}

const src = computed(() =>
  props.imageUrl || props.pill?.imageUrl || props.uploadedPhoto || null
)

const shapeClass = computed(() => pillShapeClass(props.pill?.physical?.shape))
const colorStyle = computed(() => pillColorStyle(props.pill?.physical?.color))
const imprint = computed(() => props.pill?.physical?.imprint)

const canZoom = computed(() => props.zoomable && !!src.value)
const zoomOpen = ref(false)

const imageAlt = computed(() =>
  props.pill?.name ? `${props.pill.name} pill` : 'Pill photo'
)

function openZoom(event) {
  if (!canZoom.value) return
  event.stopPropagation()
  event.preventDefault()
  zoomOpen.value = true
}

function closeZoom() {
  zoomOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') closeZoom()
}

watch(zoomOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden"
    :class="[
      sizeClass[size],
      canZoom && 'cursor-zoom-in hover:ring-2 hover:ring-primary-500/40 transition-shadow',
    ]"
    :role="canZoom ? 'button' : undefined"
    :tabindex="canZoom ? 0 : undefined"
    :aria-label="canZoom ? `View larger ${imageAlt}` : undefined"
    @click="openZoom"
    @keydown.enter.stop="openZoom"
    @keydown.space.prevent.stop="openZoom"
  >
    <img
      v-if="src"
      :src="src"
      :alt="imageAlt"
      class="w-full h-full object-contain p-1 pointer-events-none"
    >
    <div
      v-else-if="pill?.physical"
      class="flex items-center justify-center w-[70%] h-[70%] shadow-md border border-black/10 pointer-events-none"
      :class="shapeClass"
      :style="colorStyle"
    >
      <span
        v-if="imprint"
        class="text-[8px] font-bold text-gray-700 text-center leading-tight px-0.5 max-w-full truncate"
        :class="{ 'rotate-[-45deg]': shapeClass.includes('rotate-45') }"
      >
        {{ imprint }}
      </span>
    </div>
    <UIcon v-else name="i-heroicons-beaker" class="w-8 h-8 text-gray-400" aria-hidden="true" />
  </div>

  <Teleport to="body">
    <div
      v-if="zoomOpen && src"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      :aria-label="imageAlt"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/80"
        aria-label="Close"
        @click="closeZoom"
      />
      <div class="relative z-10 max-w-3xl w-full flex flex-col items-end gap-3">
        <button
          type="button"
          class="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="Close"
          @click="closeZoom"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
        <img
          :src="src"
          :alt="imageAlt"
          class="max-h-[min(85vh,40rem)] w-full object-contain rounded-lg shadow-2xl"
        >
      </div>
    </div>
  </Teleport>
</template>
