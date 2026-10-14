import { breakEvenRate, consolidationSavings, isUneconomical } from "./costs";
import { getPrivacyWarnings } from "./privacy";
import type { FeeEnvironment, Recommendation, Utxo } from "./types";

/**
 * Create a first-pass recommendation using every supplied UTXO as one batch.
 * Savings are integer sats and fee-rate assumptions are sat/vB.
 * TODO: Add selection and batch optimization with the planner UI.
 */
export function recommendConsolidation(
  utxos: readonly Utxo[],
  feeEnvironment: FeeEnvironment,
): Recommendation {
  const estimatedSavingsSats = consolidationSavings(
    utxos,
    feeEnvironment.nowRateSatPerVb,
    feeEnvironment.futureRateSatPerVb,
    feeEnvironment.consolidationScriptType,
  );
  const breakEvenRateSatPerVb = breakEvenRate(
    utxos,
    feeEnvironment.consolidationScriptType,
    feeEnvironment.futureRateSatPerVb,
  );

  return {
    estimatedSavingsSats,
    breakEvenRateSatPerVb,
    uneconomicalUtxos: utxos.filter((utxo) =>
      isUneconomical(utxo, feeEnvironment.nowRateSatPerVb),
    ),
    privacyWarnings: getPrivacyWarnings(utxos),
    shouldConsolidate: estimatedSavingsSats > 0,
  };
}
