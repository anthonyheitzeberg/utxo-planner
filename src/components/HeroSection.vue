<script setup lang="ts">
defineProps<{
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}>();
</script>

<template>
  <section
    id="overview"
    class="mx-auto w-[min(100%-2rem,72rem)] py-12 sm:py-16"
    aria-labelledby="page-title"
  >
    <p
      class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted dark:text-muted-dark"
    >
      {{ eyebrow }}
    </p>
    <h1
      id="page-title"
      class="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-content dark:text-content-dark sm:text-5xl"
    >
      {{ title }}
    </h1>
    <p
      class="mt-5 max-w-2xl text-base leading-7 text-muted dark:text-muted-dark"
    >
      {{ description }}
    </p>
    <div
      class="mt-8 grid gap-px overflow-hidden border border-border bg-border dark:border-border-dark dark:bg-border-dark sm:grid-cols-3"
    >
      <slot />
    </div>
    <div class="mt-7 flex flex-wrap gap-3">
      <a
        class="inline-flex min-h-11 items-center justify-center bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        href="#cost-model"
        >Read the cost model</a
      >
      <a
        class="inline-flex min-h-11 items-center justify-center border border-border px-5 py-2.5 text-sm font-semibold text-content hover:border-primary hover:text-primary dark:border-border-dark dark:text-content-dark dark:hover:border-primary-dark dark:hover:text-primary-dark"
        href="https://github.com/anthonyheitzeberg/utxo-planner"
        rel="noreferrer"
        target="_blank"
        >View the project</a
      >
    </div>
  </section>
</template>
