<script setup>
const { dialog, accept, dismiss } = useConfirm()

const isOpen = computed({
  get: () => dialog.value.open,
  set: (value) => {
    if (!value) dismiss()
  }
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="dialog.title"
    :description="dialog.message"
    :dismissible="false"
    :close="false"
  >
    <template #footer>
      <div class="flex gap-2 w-full">
        <UButton
          block
          color="neutral"
          variant="outline"
          @click="dismiss"
        >
          {{ dialog.cancelLabel }}
        </UButton>
        <UButton
          block
          :color="dialog.destructive ? 'error' : 'primary'"
          @click="accept"
        >
          {{ dialog.confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
