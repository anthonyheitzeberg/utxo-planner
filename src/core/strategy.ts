import { breakEvenRate, consolidationSavings, isUneconomical } from "./costs";
import { getPrivacyWarnings } from "./privacy";
import type { FeeEnvironment, Recommendation, Utxo } from "./types";

/** Plain-language outcome of a consolidation estimate. */
export type VerdictKind = "consolidate-now" | "wait" | "not-worth-it";

/** A verdict with the reasoning behind it. */
export interface Verdict {
  readonly kind: VerdictKind;
  readonly reasons: readonly string[];
}

/** Round a sat/vB rate to at most two decimals for display in reasons. */
function describeRate(rateSatPerVb: number): string {
  return `${Number(rateSatPerVb.toFixed(2))} sat/vB`;
}

/**
 * Turn a recommendation into a verdict:
 * - fewer than two UTXOs, or no positive break-even rate: "not-worth-it";
 * - estimated savings (sats) above zero: "consolidate-now";
 * - otherwise: "wait" for fees (sat/vB) to fall below the break-even rate.
 */
export function getVerdict(
  utxos: readonly Utxo[],
  feeEnvironment: FeeEnvironment,
  recommendation: Recommendation,
): Verdict {
  const breakEven = recommendation.breakEvenRateSatPerVb;
  const nowRate = feeEnvironment.nowRateSatPerVb;

  if (utxos.length < 2) {
    return {
      kind: "not-worth-it",
      reasons: [
        "Consolidation needs at least two UTXOs. Consolidating one input only adds a fee.",
      ],
    };
  }
  if (breakEven === undefined) {
    return {
      kind: "not-worth-it",
      reasons: [
        "The chosen output type is not estimated to be smaller to spend than these inputs combined, so no future input-size savings are modeled.",
      ],
    };
  }
  if (breakEven <= 0) {
    return {
      kind: "not-worth-it",
      reasons: [
        "The expected future fee rate is 0 sat/vB, so later spends are estimated to cost nothing extra and no current fee rate pays for itself.",
      ],
    };
  }

  const reasons: string[] = [];
  let kind: VerdictKind;
  if (recommendation.estimatedSavingsSats > 0) {
    kind = "consolidate-now";
    reasons.push(
      `Estimated net savings are ${recommendation.estimatedSavingsSats} sats at the assumed rates.`,
      `The current rate (${describeRate(nowRate)}) is below the break-even rate (${describeRate(breakEven)}).`,
    );
  } else {
    kind = "wait";
    reasons.push(
      `At the current rate (${describeRate(nowRate)}), the fee now is estimated to be at least as large as the future savings.`,
      `Consolidating is estimated to pay off when fees are below ${describeRate(breakEven)}, or if you expect a higher future rate.`,
    );
  }
  if (recommendation.uneconomicalUtxos.length > 0) {
    reasons.push(
      `${recommendation.uneconomicalUtxos.length} UTXO(s) cost more to spend than they hold at the current rate, which warrants checking.`,
    );
  }
  return { kind, reasons };
}

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
