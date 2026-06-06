<script setup>
const route = useRoute()
const router = useRouter()
const { cabinet, removeFromCabinet, ready, loading: cabinetLoading, removingId } = useCabinet()
const { confirm } = useConfirm()

const pillId = computed(() => decodeURIComponent(String(route.params.id || '')))
const pill = computed(() => cabinet.value.find(p => p.id === pillId.value))

useSiteSeo({
  title: computed(() => (pill.value?.name ? `${pill.value.name} · Cabinet` : 'Cabinet Pill')),
  description: computed(() =>
    pill.value?.name
      ? `View details for ${pill.value.name} in your What The Pill cabinet.`
      : 'View a saved medication in your personal pill cabinet.'
  ),
  noindex: true,
})

watch([ready, cabinetLoading, pillId, cabinet], () => {
  if (!ready.value || cabinetLoading.value) return
  if (!cabinet.value.length) return
  if (!pill.value) {
    router.replace('/cabinet')
  }
})

async function handleRemove() {
  if (!pill.value) return
  const ok = await confirm({
    title: 'Remove from cabinet?',
    message: `Remove ${pill.value.name} from your cabinet? This cannot be undone.`,
    confirmLabel: 'Remove',
    destructive: true
  })
  if (!ok) return
  await removeFromCabinet(pill.value.id)
  await router.push('/cabinet')
}
</script>

<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[
        { label: 'Cabinet', to: '/cabinet' },
        { label: pill?.name || '…' }
      ]"
    />

    <div v-if="!ready || cabinetLoading || !pill" class="text-center py-16 space-y-3">
      <USkeleton class="h-8 w-8 rounded-full mx-auto" />
      <p class="text-sm text-gray-400">Loading pill…</p>
    </div>

    <template v-else>
      <PillResult :result="pill" :show-add="false" />

      <UTooltip text="Permanently remove this pill from your saved cabinet">
        <UButton
          block
          color="error"
          variant="soft"
          icon="i-heroicons-trash"
          :loading="removingId === pill.id"
          :disabled="!!removingId"
          @click="handleRemove"
        >
          Remove from Cabinet
        </UButton>
      </UTooltip>
    </template>
  </div>
</template>
