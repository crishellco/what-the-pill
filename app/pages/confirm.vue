<script setup>
import { useSupabaseUser, useSupabaseCookieRedirect } from '#imports'

useSiteSeo({
  title: 'Confirming Sign In',
  noindex: true,
})

const user = useSupabaseUser()
const redirect = useSupabaseCookieRedirect()

watchEffect(() => {
  if (user.value) {
    navigateTo(redirect.pluck() || '/cabinet')
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 space-y-3">
    <USkeleton class="h-8 w-8 rounded-full" />
    <p class="text-sm text-gray-400">Completing sign in…</p>
  </div>
</template>
