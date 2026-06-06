<script setup>
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loading = ref(false)
const error = ref(null)

watchEffect(() => {
  if (user.value) navigateTo('/cabinet')
})

async function signInWithGoogle() {
  loading.value = true
  error.value = null
  try {
    const redirectTo = `${window.location.origin}/confirm`
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (authError) throw authError
  } catch (e) {
    error.value = e.message || 'Could not sign in with Google.'
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-sm mx-auto pt-8">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Sign in</h1>
      <p class="text-sm text-gray-500">Save pills and check interactions across devices</p>
    </div>

    <UButton
      block
      size="xl"
      color="neutral"
      variant="outline"
      :loading="loading"
      @click="signInWithGoogle"
    >
      <UIcon name="i-simple-icons-google" class="w-5 h-5 mr-2" />
      Continue with Google
    </UButton>

    <UAlert v-if="error" color="error" :description="error" />

    <p class="text-xs text-center text-gray-400">
      Only Google sign-in is supported. Identification is still free without an account.
    </p>
  </div>
</template>
