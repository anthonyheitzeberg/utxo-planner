import { createUtxo, InvalidUtxoError, type Utxo } from "../core/types";

/** Sanity bound on user-entered fee rates (sat/vB), to avoid absurd inputs. */
export const MAX_FEE_RATE_SAT_PER_VB = 100_000;

const UNSIGNED_INTEGER = /^\d+$/;
const UNSIGNED_DECIMAL = /^\d+(\.\d+)?$/;

/** Raw, untrusted text fields for one UTXO (from a form or a CSV row). */
export interface UtxoFields {
  readonly txid: string;
  readonly vout: string;
  readonly valueSats: string;
  readonly scriptType: string;
}

/** Result of parsing a fee rate in sat/vB. */
export type FeeRateResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: string };

/**
 * Convert untrusted text fields into a validated UTXO.
 * Throws InvalidUtxoError; messages never echo the input.
 */
export function utxoFromFields(fields: UtxoFields): Utxo {
  const vout = fields.vout.trim();
  const valueSats = fields.valueSats.trim();
  if (!UNSIGNED_INTEGER.test(vout)) {
    throw new InvalidUtxoError(
      "Output index must be a non-negative whole number.",
    );
  }
  if (!UNSIGNED_INTEGER.test(valueSats)) {
    throw new InvalidUtxoError(
      "Value must be a positive whole number of sats.",
    );
  }
  return createUtxo({
    txid: fields.txid.trim(),
    vout: Number(vout),
    valueSats: Number(valueSats),
    scriptType: fields.scriptType.trim().toLowerCase(),
  });
}

/** Stable identity of an output: lowercase txid and vout. */
export function outpointKey(utxo: Utxo): string {
  return `${utxo.txid.toLowerCase()}:${utxo.vout}`;
}

/** Parse a user-entered fee rate in sat/vB. */
export function parseFeeRate(input: string, label: string): FeeRateResult {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: false, error: `Enter a ${label} in sat/vB.` };
  }
  if (!UNSIGNED_DECIMAL.test(trimmed)) {
    return {
      ok: false,
      error: `The ${label} must be a non-negative number in sat/vB.`,
    };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value > MAX_FEE_RATE_SAT_PER_VB) {
    return {
      ok: false,
      error: `The ${label} must be at most ${MAX_FEE_RATE_SAT_PER_VB} sat/vB.`,
    };
  }
  return { ok: true, value };
}
