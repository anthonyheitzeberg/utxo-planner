<script setup lang="ts">
import { ref } from "vue";

const menuOpen = ref(false);
</script>

<template>
  <header class="border-b border-border dark:border-border-dark">
    <div
      class="mx-auto flex min-h-16 w-[min(100%-2rem,72rem)] flex-wrap items-center justify-between gap-4 py-3"
    >
      <a
        class="font-semibold tracking-tight text-content dark:text-content-dark"
        href="#overview"
      >
        UTXO Planner
      </a>
      <button
        class="inline-flex min-h-10 items-center border border-border px-3 text-sm font-medium text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-border-dark dark:text-content-dark sm:hidden"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="site-nav"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? "close menu" : "menu" }}
      </button>
      <nav
        id="site-nav"
        class="w-full flex-col gap-4 pt-2 text-sm text-muted dark:text-muted-dark sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-5 sm:pt-0"
        :class="menuOpen ? 'flex' : 'hidden'"
        aria-label="Main navigation"
      >
        <a
          class="hover:text-primary dark:hover:text-primary-dark"
          href="#overview"
          @click="menuOpen = false"
          >home</a
        >
        <a
          class="hover:text-primary dark:hover:text-primary-dark"
          href="#cost-model"
          @click="menuOpen = false"
          >methodology</a
        >
        <a
          class="hover:text-primary dark:hover:text-primary-dark"
          href="#privacy"
          @click="menuOpen = false"
          >privacy</a
        >
        <a
          class="hover:text-primary dark:hover:text-primary-dark"
          href="https://github.com/anthonyheitzeberg/utxo-planner"
          rel="noreferrer"
          target="_blank"
          @click="menuOpen = false"
          >github</a
        >
      </nav>
    </div>
  </header>
</template>
