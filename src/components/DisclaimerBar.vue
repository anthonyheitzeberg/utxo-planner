<script setup lang="ts">
defineProps<{
  readonly message: string;
}>();
</script>

<template>
  <aside
    class="mx-auto my-8 w-[min(100%-2rem,72rem)] border-l-4 border-warning bg-warning/10 px-5 py-4 text-sm leading-6 text-content dark:border-warning-dark dark:bg-warning-dark/10 dark:text-content-dark"
  >
    <p class="font-semibold">Planning estimate, not financial advice</p>
    <p class="mt-1">{{ message }}</p>
  </aside>
</template>
