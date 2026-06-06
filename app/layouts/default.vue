<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl">💊</span>
          <span class="font-bold text-lg text-gray-900 dark:text-white">What The Pill</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <NuxtLink to="/cabinet" class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            My Pills
          </NuxtLink>
          <AuthButton />
        </div>
      </div>
    </header>
    <main class="max-w-2xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
