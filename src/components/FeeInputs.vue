<script setup lang="ts">
import { usePlannerStore } from "../stores/plannerStore";

const store = usePlannerStore();
</script>

<template>
  <section class="panel" aria-labelledby="fees-title">
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
      assumptions
    </p>
    <h2 id="fees-title" class="mt-2 text-xl font-semibold text-content">
      Fee rates and output type
    </h2>
    <p class="mt-2 text-sm leading-6 text-muted">
      The values below are static placeholder assumptions, not live data. Edit
      them to match your situation.
    </p>
    <div class="mt-4 grid gap-4 sm:grid-cols-3">
      <div>
        <label class="field-label" for="now-rate"
          >Current fee rate (sat/vB)</label
        >
        <input
          id="now-rate"
          v-model="store.nowRateInput"
          class="field-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
        />
      </div>
      <div>
        <label class="field-label" for="future-rate"
          >Expected future fee rate (sat/vB)</label
        >
        <input
          id="future-rate"
          v-model="store.futureRateInput"
          class="field-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
        />
      </div>
      <div>
        <label class="field-label" for="output-type"
          >Consolidated output type</label
        >
        <select
          id="output-type"
          v-model="store.outputScriptType"
          class="field-input"
        >
          <option v-for="type in store.scriptTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
    </div>
    <ul v-if="store.feeErrors.length > 0" class="mt-4 space-y-1" role="alert">
      <li
        v-for="error in store.feeErrors"
        :key="error"
        class="text-sm font-medium text-warning"
      >
        <span aria-hidden="true">⚠ </span>{{ error }}
      </li>
    </ul>
  </section>
</template>
