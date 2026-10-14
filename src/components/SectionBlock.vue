<script setup lang="ts">
defineProps<{
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
}>();
</script>

<template>
  <section
    :id="id"
    class="mx-auto w-[min(100%-2rem,48rem)] scroll-mt-8 border-b border-border py-10 dark:border-border-dark sm:py-12"
  >
    <p
      class="text-xs font-semibold uppercase tracking-[0.16em] text-muted dark:text-muted-dark"
    >
      {{ eyebrow }}
    </p>
    <h2
      class="mt-3 text-2xl font-semibold tracking-tight text-content dark:text-content-dark sm:text-3xl"
    >
      {{ title }}
    </h2>
    <div
      class="mt-4 space-y-4 text-sm leading-7 text-muted dark:text-muted-dark"
    >
      <slot />
    </div>
  </section>
</template>
