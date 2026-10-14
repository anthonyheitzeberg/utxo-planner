import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { consolidationCost, isUneconomical } from "../core/costs";
import { SCRIPT_TYPES } from "../core/scripts";
import { getVerdict, recommendConsolidation } from "../core/strategy";
import type { FeeEnvironment, ScriptType, Utxo } from "../core/types";
import { InvalidUtxoError } from "../core/types";
import {
  MAX_CSV_CHARS,
  parseCsv,
  type CsvRowError,
} from "../services/csvParser";
import {
  outpointKey,
  parseFeeRate,
  utxoFromFields,
  type UtxoFields,
} from "../services/fieldParsers";

/** Placeholder assumption: current fee rate, in sat/vB. User-editable. */
export const DEFAULT_NOW_RATE_SAT_PER_VB = 5;
/** Placeholder assumption: expected future fee rate, in sat/vB. User-editable. */
export const DEFAULT_FUTURE_RATE_SAT_PER_VB = 20;
export const DEFAULT_OUTPUT_SCRIPT_TYPE: ScriptType = "p2wpkh";

export type ImportStatus = "idle" | "loading" | "error";

export type AddUtxoResult =
  { readonly ok: true } | { readonly ok: false; readonly error: string };

/** Planner state. UTXO data lives in memory only and is never persisted. */
export const usePlannerStore = defineStore("planner", () => {
  const utxos = ref<readonly Utxo[]>([]);
  const nowRateInput = ref(String(DEFAULT_NOW_RATE_SAT_PER_VB));
  const futureRateInput = ref(String(DEFAULT_FUTURE_RATE_SAT_PER_VB));
  const outputScriptType = ref<ScriptType>(DEFAULT_OUTPUT_SCRIPT_TYPE);

  const importStatus = ref<ImportStatus>("idle");
  const importMessage = ref("");
  const csvErrors = ref<readonly CsvRowError[]>([]);
  const importedCount = ref<number | null>(null);

  const nowRate = computed(() =>
    parseFeeRate(nowRateInput.value, "current fee rate"),
  );
  const futureRate = computed(() =>
    parseFeeRate(futureRateInput.value, "expected future fee rate"),
  );
  const feeErrors = computed<readonly string[]>(() => {
    const errors: string[] = [];
    if (!nowRate.value.ok) errors.push(nowRate.value.error);
    if (!futureRate.value.ok) errors.push(futureRate.value.error);
    return errors;
  });

  const feeEnvironment = computed<FeeEnvironment | null>(() =>
    nowRate.value.ok && futureRate.value.ok
      ? {
          nowRateSatPerVb: nowRate.value.value,
          futureRateSatPerVb: futureRate.value.value,
          consolidationScriptType: outputScriptType.value,
        }
      : null,
  );

  const tableRows = computed(() =>
    utxos.value.map((utxo) => ({
      utxo,
      key: outpointKey(utxo),
      uneconomical: nowRate.value.ok
        ? isUneconomical(utxo, nowRate.value.value)
        : null,
    })),
  );

  const recommendation = computed(() =>
    feeEnvironment.value && utxos.value.length > 0
      ? recommendConsolidation(utxos.value, feeEnvironment.value)
      : null,
  );
  const verdict = computed(() =>
    feeEnvironment.value && recommendation.value
      ? getVerdict(utxos.value, feeEnvironment.value, recommendation.value)
      : null,
  );
  const costNowSats = computed(() =>
    feeEnvironment.value && utxos.value.length > 0
      ? consolidationCost(
          utxos.value,
          feeEnvironment.value.nowRateSatPerVb,
          outputScriptType.value,
        )
      : null,
  );

  function hasOutpoint(utxo: Utxo): boolean {
    const key = outpointKey(utxo);
    return utxos.value.some((existing) => outpointKey(existing) === key);
  }

  function addManual(fields: UtxoFields): AddUtxoResult {
    try {
      const utxo = utxoFromFields(fields);
      if (hasOutpoint(utxo)) {
        return { ok: false, error: "This output is already in the list." };
      }
      utxos.value = [...utxos.value, utxo];
      return { ok: true };
    } catch (error) {
      if (error instanceof InvalidUtxoError) {
        return { ok: false, error: error.message };
      }
      throw error;
    }
  }

  function importCsvText(text: string): void {
    const result = parseCsv(text);
    const errors: CsvRowError[] = [...result.errors];
    const added: Utxo[] = [];
    for (const row of result.rows) {
      if (hasOutpoint(row.utxo)) {
        errors.push({
          line: row.line,
          message: "This output is already in the list.",
        });
      } else {
        added.push(row.utxo);
      }
    }
    utxos.value = [...utxos.value, ...added];
    csvErrors.value = errors.sort((a, b) => a.line - b.line);
    importedCount.value = added.length;
    importStatus.value = "idle";
    importMessage.value = "";
  }

  async function importCsvFile(file: File): Promise<void> {
    importStatus.value = "loading";
    importMessage.value = "";
    csvErrors.value = [];
    importedCount.value = null;
    if (file.size > MAX_CSV_CHARS * 4) {
      importStatus.value = "error";
      importMessage.value = "That file is too large to import.";
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      importStatus.value = "error";
      importMessage.value = "The file could not be read. Try pasting instead.";
      return;
    }
    importCsvText(text);
  }

  function removeUtxo(key: string): void {
    utxos.value = utxos.value.filter((utxo) => outpointKey(utxo) !== key);
  }

  function clearUtxos(): void {
    utxos.value = [];
    csvErrors.value = [];
    importedCount.value = null;
  }

  return {
    scriptTypes: SCRIPT_TYPES,
    utxos,
    nowRateInput,
    futureRateInput,
    outputScriptType,
    importStatus,
    importMessage,
    csvErrors,
    importedCount,
    feeErrors,
    tableRows,
    recommendation,
    verdict,
    costNowSats,
    addManual,
    importCsvText,
    importCsvFile,
    removeUtxo,
    clearUtxos,
  };
});
