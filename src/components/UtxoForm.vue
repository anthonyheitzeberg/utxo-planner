<script setup lang="ts">
import { reactive, ref } from "vue";
import { usePlannerStore } from "../stores/plannerStore";

const store = usePlannerStore();

const form = reactive({
  txid: "",
  vout: "0",
  valueSats: "",
  scriptType: "p2wpkh",
});
const error = ref("");

function onSubmit(): void {
  const result = store.addManual({ ...form });
  if (result.ok) {
    error.value = "";
    form.txid = "";
    form.vout = "0";
    form.valueSats = "";
  } else {
    error.value = result.error;
  }
}
</script>

<template>
  <section class="panel" aria-labelledby="manual-title">
    <h3 id="manual-title" class="text-lg font-semibold text-content">
      Add a UTXO manually
    </h3>
    <form class="mt-4 space-y-4" novalidate @submit.prevent="onSubmit">
      <div>
        <label class="field-label" for="manual-txid"
          >Transaction ID (txid)</label
        >
        <input
          id="manual-txid"
          v-model="form.txid"
          class="field-input font-mono"
          type="text"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="field-label" for="manual-vout"
            >Output index (vout)</label
          >
          <input
            id="manual-vout"
            v-model="form.vout"
            class="field-input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
          />
        </div>
        <div>
          <label class="field-label" for="manual-value">Value (sats)</label>
          <input
            id="manual-value"
            v-model="form.valueSats"
            class="field-input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
          />
        </div>
      </div>
      <div>
        <label class="field-label" for="manual-script">Script type</label>
        <select
          id="manual-script"
          v-model="form.scriptType"
          class="field-input"
        >
          <option v-for="type in store.scriptTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      <p v-if="error" class="text-sm font-medium text-warning" role="alert">
        <span aria-hidden="true">⚠ </span>{{ error }}
      </p>
      <button class="btn-primary" type="submit">Add UTXO</button>
    </form>
  </section>
</template>
