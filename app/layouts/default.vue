<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <UContainer class="max-w-2xl py-3 flex items-center justify-between">
        <ULink to="/" class="flex items-center gap-2">
          <span class="text-2xl">💊</span>
          <span class="font-bold text-lg text-gray-900 dark:text-white">What The Pill</span>
        </ULink>
        <div class="flex items-center gap-3">
          <UTooltip text="Identify an unknown pill by imprint, description, or photo">
            <ULink
              to="/"
              class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Identify
            </ULink>
          </UTooltip>
          <UTooltip text="View and manage your saved pills">
            <ULink
              to="/cabinet"
              class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cabinet
            </ULink>
          </UTooltip>
          <AuthButton />
        </div>
      </UContainer>
    </header>
    <UContainer as="main" class="max-w-2xl py-8 overflow-x-hidden">
      <slot />
    </UContainer>
  </div>
</template>
