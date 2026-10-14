<script setup lang="ts">
import { usePlannerStore } from "../stores/plannerStore";
import { formatSats, shortenTxid } from "../utils/format";

const store = usePlannerStore();
</script>

<template>
  <section class="panel" aria-labelledby="table-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="table-title" class="text-xl font-semibold text-content">
        Your UTXOs
      </h2>
      <button
        v-if="store.tableRows.length > 0"
        class="btn-secondary"
        type="button"
        @click="store.clearUtxos()"
      >
        Clear all
      </button>
    </div>

    <p v-if="store.tableRows.length === 0" class="mt-4 text-sm text-muted">
      No UTXOs yet. Add one manually or import a CSV above.
    </p>
    <div v-else class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[38rem] text-left text-sm">
        <caption class="sr-only">
          Entered UTXOs with value, script type, and viability at the current
          fee rate
        </caption>
        <thead class="border-b border-border text-muted">
          <tr>
            <th scope="col" class="py-2 pr-3 font-medium">txid</th>
            <th scope="col" class="py-2 pr-3 font-medium">vout</th>
            <th scope="col" class="py-2 pr-3 text-right font-medium">
              value (sats)
            </th>
            <th scope="col" class="py-2 pr-3 font-medium">script type</th>
            <th scope="col" class="py-2 pr-3 font-medium">viability</th>
            <th scope="col" class="py-2 font-medium">
              <span class="sr-only">actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in store.tableRows"
            :key="row.key"
            class="border-b border-border last:border-b-0"
          >
            <td class="py-2 pr-3 font-mono" :title="row.utxo.txid">
              {{ shortenTxid(row.utxo.txid) }}
            </td>
            <td class="py-2 pr-3">{{ row.utxo.vout }}</td>
            <td class="py-2 pr-3 text-right tabular-nums">
              {{ formatSats(row.utxo.valueSats) }}
            </td>
            <td class="py-2 pr-3">{{ row.utxo.scriptType }}</td>
            <td class="py-2 pr-3">
              <span v-if="row.uneconomical === null" class="text-muted">
                unknown: fix fee rate
              </span>
              <span
                v-else-if="row.uneconomical"
                class="font-medium text-warning"
              >
                <span aria-hidden="true">⚠ </span>costs more to spend than it
                holds
              </span>
              <span v-else class="text-content">
                <span aria-hidden="true">✓ </span>worth spending
              </span>
            </td>
            <td class="py-2 text-right">
              <button
                class="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
                :aria-label="`Remove output ${shortenTxid(row.utxo.txid)}:${row.utxo.vout}`"
                @click="store.removeUtxo(row.key)"
              >
                remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
