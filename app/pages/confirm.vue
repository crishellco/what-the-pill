<script setup>
const user = useSupabaseUser()
const redirect = useSupabaseCookieRedirect()

watchEffect(() => {
  if (user.value) {
    navigateTo(redirect.pluck() || '/cabinet')
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
    <p class="text-sm">Completing sign in…</p>
  </div>
</template>
