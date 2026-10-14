export type ScriptType = "p2pkh" | "p2sh-p2wpkh" | "p2wpkh" | "p2tr";

export interface Utxo {
  readonly txid: string;
  readonly vout: number;
  readonly valueSats: number;
  readonly scriptType: ScriptType;
}

export interface FeeEnvironment {
  readonly nowRateSatPerVb: number;
  readonly futureRateSatPerVb: number;
  readonly consolidationScriptType: ScriptType;
}

export interface Recommendation {
  readonly estimatedSavingsSats: number;
  readonly breakEvenRateSatPerVb: number | undefined;
  readonly uneconomicalUtxos: readonly Utxo[];
  readonly privacyWarnings: readonly string[];
  readonly shouldConsolidate: boolean;
}

/** Error for invalid UTXO fields, with monetary values expressed in sats. */
export class InvalidUtxoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUtxoError";
  }
}

/** Validate an untrusted UTXO value before using it in the cost model. */
export function validateUtxo(value: unknown): Utxo {
  if (typeof value !== "object" || value === null) {
    throw new InvalidUtxoError("UTXO must be an object.");
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.txid !== "string" ||
    !/^[0-9a-fA-F]{64}$/.test(candidate.txid)
  ) {
    throw new InvalidUtxoError(
      "Transaction ID must be 64 hexadecimal characters.",
    );
  }
  if (
    typeof candidate.vout !== "number" ||
    !Number.isSafeInteger(candidate.vout) ||
    candidate.vout < 0
  ) {
    throw new InvalidUtxoError(
      "Output index must be a non-negative safe integer.",
    );
  }
  if (
    typeof candidate.valueSats !== "number" ||
    !Number.isSafeInteger(candidate.valueSats) ||
    candidate.valueSats <= 0
  ) {
    throw new InvalidUtxoError(
      "Value must be a positive integer number of sats.",
    );
  }
  if (
    candidate.scriptType !== "p2pkh" &&
    candidate.scriptType !== "p2sh-p2wpkh" &&
    candidate.scriptType !== "p2wpkh" &&
    candidate.scriptType !== "p2tr"
  ) {
    throw new InvalidUtxoError("Script type is not supported.");
  }

  return {
    txid: candidate.txid,
    vout: candidate.vout,
    valueSats: candidate.valueSats,
    scriptType: candidate.scriptType,
  };
}
