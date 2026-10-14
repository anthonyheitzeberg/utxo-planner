<script setup lang="ts">
defineProps<{
  readonly label: string;
  readonly description: string;
}>();
</script>

<template>
  <article class="bg-panel p-5 dark:bg-panel-dark">
    <h2
      class="text-sm font-semibold lowercase text-content dark:text-content-dark"
    >
      {{ label }}
    </h2>
    <p class="mt-2 text-sm leading-6 text-muted dark:text-muted-dark">
      {{ description }}
    </p>
  </article>
</template>
