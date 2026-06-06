<script setup>
import { pillColorStyle, pillShapeClass } from '~/utils/pillVisual'

const props = defineProps({
  pill: { type: Object, default: null },
  imageUrl: { type: String, default: null },
  uploadedPhoto: { type: String, default: null },
  size: { type: String, default: 'md' }
})

const sizeClass = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14 sm:w-20 sm:h-20',
  lg: 'w-16 h-16 sm:w-28 sm:h-28'
}

const src = computed(() =>
  props.imageUrl || props.pill?.imageUrl || props.uploadedPhoto || null
)

const shapeClass = computed(() => pillShapeClass(props.pill?.physical?.shape))
const colorStyle = computed(() => pillColorStyle(props.pill?.physical?.color))
const imprint = computed(() => props.pill?.physical?.imprint)
</script>

<template>
  <div
    class="shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden"
    :class="sizeClass[size]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="pill?.name ? `${pill.name} pill` : 'Pill photo'"
      class="w-full h-full object-contain p-1"
    >
    <div
      v-else-if="pill?.physical"
      class="flex items-center justify-center w-[70%] h-[70%] shadow-md border border-black/10"
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
</template>
