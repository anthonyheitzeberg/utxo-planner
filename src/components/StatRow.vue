<script setup lang="ts">
export interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly note: string;
}

defineProps<{
  readonly items: readonly StatItem[];
}>();
</script>

<template>
  <section
    class="mx-auto grid w-[min(100%-2rem,72rem)] gap-4 border-y border-border py-7 dark:border-border-dark sm:grid-cols-3"
    aria-label="Planner status"
  >
    <article v-for="item in items" :key="item.label">
      <p
        class="text-3xl font-semibold tracking-tight text-content dark:text-content-dark"
      >
        {{ item.value }}
      </p>
      <h2 class="mt-1 text-sm font-medium text-content dark:text-content-dark">
        {{ item.label }}
      </h2>
      <p class="mt-1 text-xs leading-5 text-muted dark:text-muted-dark">
        {{ item.note }}
      </p>
    </article>
  </section>
</template>
