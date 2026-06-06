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
  <div v-if="user" class="flex items-center gap-2">
    <img
      v-if="user.user_metadata?.avatar_url"
      :src="user.user_metadata.avatar_url"
      :alt="user.user_metadata.full_name || 'Account'"
      class="w-7 h-7 rounded-full"
    />
    <UButton
      size="xs"
      color="neutral"
      variant="ghost"
      @click="signOut"
    >
      Sign out
    </UButton>
  </div>
  <UButton
    v-else
    to="/login"
    size="xs"
    color="neutral"
    variant="ghost"
  >
    Sign in
  </UButton>
</template>
