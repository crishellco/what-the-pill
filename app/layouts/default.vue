<script setup>
const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
    >
      Skip to content
    </a>

    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <UContainer class="max-w-2xl py-3 flex items-center justify-between">
        <ULink to="/" class="flex items-center gap-2" aria-label="What The Pill — home">
          <LogoIcon class="w-7 h-7" />
          <span class="font-bold text-lg text-gray-900 dark:text-white">What The Pill</span>
        </ULink>
        <nav aria-label="Main navigation" class="flex items-center gap-3">
          <ULink
            to="/"
            :exact="true"
            active-class="text-gray-900 dark:text-white font-semibold"
            inactive-class="text-gray-500 hover:text-gray-900 dark:hover:text-white"
            class="text-sm transition-colors"
          >
            Identify
          </ULink>
          <ULink
            to="/cabinet"
            active-class="text-gray-900 dark:text-white font-semibold"
            inactive-class="text-gray-500 hover:text-gray-900 dark:hover:text-white"
            class="text-sm transition-colors"
          >
            Cabinet
          </ULink>
          <AuthButton />
        </nav>
      </UContainer>
    </header>

    <UContainer
      id="main-content"
      as="main"
      tabindex="-1"
      class="max-w-2xl py-8 overflow-x-hidden outline-none"
    >
      <slot />
    </UContainer>
  </div>
</template>
