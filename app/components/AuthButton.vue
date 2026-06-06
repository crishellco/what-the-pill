<script setup>
import { useSupabaseUser, useSupabaseClient } from '#imports'

const user = useSupabaseUser()
const supabase = useSupabaseClient()

async function signOut() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <UTooltip v-if="user" text="Sign out of your account on this device">
    <UButton
      size="sm"
      color="neutral"
      variant="ghost"
      @click="signOut"
    >
      Sign out
    </UButton>
  </UTooltip>
  <UTooltip
    v-else
    text="Sign in with email to save pills and sync your cabinet across devices"
  >
    <UButton
      to="/login"
      size="sm"
      color="neutral"
      variant="ghost"
    >
      Sign in
    </UButton>
  </UTooltip>
</template>
