<script setup>
import { useSupabaseClient, useSupabaseUser } from '#imports'

definePageMeta({ layout: 'default' })

useSiteSeo({
  title: 'Sign In',
  description: 'Sign in to save pills and manage your personal medication cabinet.',
  noindex: true,
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { public: { siteUrl } } = useRuntimeConfig()
const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref(null)

watchEffect(() => {
  if (user.value) navigateTo('/cabinet')
})

async function sendMagicLink() {
  const trimmed = email.value.trim()
  if (!trimmed) return

  loading.value = true
  error.value = null
  sent.value = false

  try {
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${siteUrl.replace(/\/$/, '')}/confirm`
      }
    })
    if (authError) throw authError
    sent.value = true
  } catch (e) {
    error.value = e.message || 'Could not send magic link.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-1">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Sign in</h1>
      <p class="text-gray-500 text-sm">Save pills and check interactions across devices</p>
    </div>

    <UCard>
      <UAlert
        v-if="sent"
        color="success"
        variant="subtle"
        icon="i-heroicons-envelope-open"
        title="Check your email"
        class="mb-4"
      >
        <template #description>
          <span class="leading-relaxed">
            We sent a sign-in link to
            <strong class="text-green-700 dark:text-green-300">{{ email }}</strong>
          </span>
        </template>
      </UAlert>

      <form v-else class="space-y-3" @submit.prevent="sendMagicLink">
        <UFormField label="Email address">
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            size="xl"
            class="w-full"
            :ui="{ root: 'w-full' }"
            autofocus
            autocomplete="email"
            required
          />
        </UFormField>
        <UTooltip text="We'll email a one-time sign-in link — no password needed">
          <UButton
            block
            size="xl"
            type="submit"
            :loading="loading"
            :disabled="!email.trim()"
            icon="i-heroicons-envelope"
          >
            Send magic link
          </UButton>
        </UTooltip>
      </form>

      <UAlert v-if="error" color="error" :description="error" class="mt-4" />
    </UCard>

    <p class="text-xs text-center text-gray-400 leading-relaxed max-w-sm mx-auto">
      No password needed — we'll email you a one-time sign-in link.
      Identification is still free without an account.
    </p>
  </div>
</template>
