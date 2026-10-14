<script setup lang="ts">
import CsvImport from "../components/CsvImport.vue";
import FeeInputs from "../components/FeeInputs.vue";
import ResultsPanel from "../components/ResultsPanel.vue";
import UtxoForm from "../components/UtxoForm.vue";
import UtxoTable from "../components/UtxoTable.vue";
</script>

<template>
  <main class="mx-auto w-[min(100%-2rem,72rem)] py-10 sm:py-12">
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
      planner
    </p>
    <h1
      class="mt-3 text-3xl font-semibold tracking-tight text-content sm:text-4xl"
    >
      Plan a consolidation
    </h1>
    <p class="mt-3 max-w-2xl text-sm leading-6 text-muted">
      Enter your UTXOs and fee assumptions. Everything is calculated in this
      page and nothing is stored or sent. Do not enter seeds, private keys, or
      extended public keys (xpubs); only outpoint details and values are needed.
    </p>

    <div class="mt-8 space-y-6">
      <FeeInputs />
      <div class="grid gap-6 lg:grid-cols-2">
        <UtxoForm />
        <CsvImport />
      </div>
      <UtxoTable />
      <ResultsPanel />
    </div>
  </main>
</template>
