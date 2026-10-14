<script setup lang="ts">
import { ref } from "vue";

const selectedNetwork = ref("testnet4");
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100"
  >
    <header
      class="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div
        class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4"
      >
        <h1 class="text-xl font-semibold tracking-tight">UTXO Planner</h1>
        <label
          class="flex items-center gap-2 text-sm font-medium"
          for="network"
        >
          Network
          <select
            id="network"
            v-model="selectedNetwork"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="mainnet">Mainnet</option>
            <option value="testnet4">Testnet4</option>
            <option value="signet">Signet</option>
          </select>
        </label>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-12">
      <p class="text-slate-600 dark:text-slate-300">
        Plan a consolidation when current fees are low relative to the fees you
        expect to pay later.
      </p>
    </main>

    <aside
      aria-label="Privacy and security notice"
      class="fixed inset-x-0 bottom-0 border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
    >
      This tool never asks for keys. It runs in your browser.
    </aside>
  </div>
</template>
