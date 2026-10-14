<script setup lang="ts">
import { ref } from "vue";
import { usePlannerStore } from "../stores/plannerStore";

const store = usePlannerStore();
const text = ref("");

function onImportText(): void {
  store.importCsvText(text.value);
  if (store.csvErrors.length === 0) {
    text.value = "";
  }
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await store.importCsvFile(file);
  }
  input.value = "";
}
</script>

<template>
  <section class="panel" aria-labelledby="csv-title">
    <h3 id="csv-title" class="text-lg font-semibold text-content">
      Import CSV
    </h3>
    <p class="mt-2 text-sm leading-6 text-muted">
      Columns:
      <code class="font-mono">txid,vout,value_sats,script_type</code>. The
      header line is optional. The file is read in your browser and is not
      uploaded anywhere.
    </p>
    <div class="mt-4">
      <label class="field-label" for="csv-text">Paste CSV</label>
      <textarea
        id="csv-text"
        v-model="text"
        class="field-input font-mono"
        rows="6"
        spellcheck="false"
        autocomplete="off"
      />
    </div>
    <div class="mt-3 flex flex-wrap items-end gap-4">
      <button class="btn-primary" type="button" @click="onImportText">
        Add rows from pasted CSV
      </button>
      <div>
        <label class="field-label" for="csv-file">Or choose a CSV file</label>
        <input
          id="csv-file"
          class="mt-1 block text-sm text-content"
          type="file"
          accept=".csv,text/csv,text/plain"
          :disabled="store.importStatus === 'loading'"
          @change="onFileChange"
        />
      </div>
    </div>

    <p
      v-if="store.importStatus === 'loading'"
      class="mt-4 text-sm text-muted"
      role="status"
    >
      Reading file…
    </p>
    <p
      v-else-if="store.importStatus === 'error'"
      class="mt-4 text-sm font-medium text-warning"
      role="alert"
    >
      <span aria-hidden="true">⚠ </span>{{ store.importMessage }}
    </p>
    <p
      v-else-if="store.importedCount !== null"
      class="mt-4 text-sm text-content"
      role="status"
    >
      Added {{ store.importedCount }} UTXO(s).
    </p>

    <div v-if="store.csvErrors.length > 0" class="mt-4" role="alert">
      <p class="text-sm font-medium text-warning">
        <span aria-hidden="true">⚠ </span>{{ store.csvErrors.length }} row
        problem(s) found:
      </p>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-content">
        <li v-for="(csvError, index) in store.csvErrors" :key="index">
          Line {{ csvError.line }}: {{ csvError.message }}
        </li>
      </ul>
    </div>
  </section>
</template>
