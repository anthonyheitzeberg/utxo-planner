import type { ScriptType, Utxo } from "./types";
import { getScriptVbytes, OVERHEAD_VB } from "./scripts";

function validateFeeRate(rateSatPerVb: number): void {
  if (!Number.isFinite(rateSatPerVb) || rateSatPerVb < 0) {
    throw new RangeError(
      "Fee rate must be a finite, non-negative number of sat/vB.",
    );
  }
}

/**
 * Estimate consolidation cost in integer sats:
 * ceil((OVERHEAD_VB + sum(input vB) + output vB) * fee rate sat/vB).
 */
export function consolidationCost(
  utxos: readonly Utxo[],
  nowRateSatPerVb: number,
  outputScriptType: ScriptType,
): number {
  validateFeeRate(nowRateSatPerVb);
  const inputsVb = utxos.reduce(
    (total, utxo) => total + getScriptVbytes(utxo.scriptType).inputVb,
    0,
  );
  const transactionVb =
    OVERHEAD_VB + inputsVb + getScriptVbytes(outputScriptType).outputVb;
  return Math.ceil(transactionVb * nowRateSatPerVb);
}

/**
 * Estimate net savings in integer sats:
 * sum(input vB) * future rate - consolidated input vB * future rate - cost now.
 * A one-input "consolidation" has no future input-size savings.
 */
export function consolidationSavings(
  utxos: readonly Utxo[],
  nowRateSatPerVb: number,
  futureRateSatPerVb: number,
  outputScriptType: ScriptType,
): number {
  validateFeeRate(futureRateSatPerVb);
  const costNow = consolidationCost(utxos, nowRateSatPerVb, outputScriptType);
  if (utxos.length === 0) {
    return 0;
  }
  if (utxos.length === 1) {
    return -costNow;
  }

  const laterWithout =
    utxos.reduce(
      (total, utxo) => total + getScriptVbytes(utxo.scriptType).inputVb,
      0,
    ) * futureRateSatPerVb;
  const laterWith =
    getScriptVbytes(outputScriptType).inputVb * futureRateSatPerVb;
  return laterWithout - laterWith - costNow;
}

/**
 * Calculate the continuous break-even fee rate in sat/vB:
 * ((input vB sum - consolidated input vB) * future rate) /
 * (OVERHEAD_VB + input vB sum + output vB).
 * Returns undefined when no positive future input-size savings are possible.
 */
export function breakEvenRate(
  utxos: readonly Utxo[],
  outputScriptType: ScriptType,
  futureRateSatPerVb: number,
): number | undefined {
  validateFeeRate(futureRateSatPerVb);
  if (utxos.length < 2) {
    return undefined;
  }

  const inputVb = utxos.reduce(
    (total, utxo) => total + getScriptVbytes(utxo.scriptType).inputVb,
    0,
  );
  const inputSavingsVb = inputVb - getScriptVbytes(outputScriptType).inputVb;
  const consolidationVb =
    OVERHEAD_VB + inputVb + getScriptVbytes(outputScriptType).outputVb;
  if (inputSavingsVb <= 0) {
    return undefined;
  }
  return (inputSavingsVb * futureRateSatPerVb) / consolidationVb;
}

/**
 * Check whether integer value sats are below the estimated input spend cost:
 * valueSats < ceil(input vB * current fee rate sat/vB).
 */
export function isUneconomical(utxo: Utxo, nowRateSatPerVb: number): boolean {
  validateFeeRate(nowRateSatPerVb);
  const spendCostSats = Math.ceil(
    getScriptVbytes(utxo.scriptType).inputVb * nowRateSatPerVb,
  );
  return utxo.valueSats < spendCostSats;
}
