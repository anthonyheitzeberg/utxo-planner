import type { Utxo } from "./types";

/**
 * Describe common-input-ownership and mixed-script privacy costs for a plan.
 */
export function getPrivacyWarnings(utxos: readonly Utxo[]): readonly string[] {
  const warnings: string[] = [];
  if (utxos.length > 1) {
    warnings.push(
      "Spending these inputs together publicly links them under the common-input-ownership heuristic.",
    );
  }

  const scriptTypes = new Set(utxos.map((utxo) => utxo.scriptType));
  if (scriptTypes.size > 1) {
    warnings.push(
      "This plan mixes script types, which may fingerprint the wallet and its spending history.",
    );
  }
  return warnings;
}
