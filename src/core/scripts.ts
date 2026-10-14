import type { ScriptType } from "./types";
import { Address, NETWORK, TEST_NETWORK } from "@scure/btc-signer";

export interface ScriptVbytes {
  readonly inputVb: number;
  readonly outputVb: number;
}

// Approximate standard sizes; verify transaction-specific estimates before changing.
// TODO: Add verified transaction references for each estimate:
// https://bitcoinops.org/en/tools/calc-size/
export const SCRIPT_VB: Readonly<Record<ScriptType, ScriptVbytes>> = {
  p2pkh: { inputVb: 148, outputVb: 34 },
  "p2sh-p2wpkh": { inputVb: 91, outputVb: 32 },
  p2wpkh: { inputVb: 68, outputVb: 31 },
  p2tr: { inputVb: 57.5, outputVb: 43 },
};

/**
 * Return the approximate input and output sizes in vbytes for a script type.
 */
export function getScriptVbytes(scriptType: ScriptType): ScriptVbytes {
  return SCRIPT_VB[scriptType];
}

/**
 * Detect the supported spend type from an address for the selected network.
 * P2SH addresses are left unclassified because the address alone cannot prove
 * whether the output is P2SH-P2WPKH or another P2SH construction.
 */
export function detectAddressScriptType(
  address: string,
  network: "mainnet" | "testnet4" | "signet",
): ScriptType | undefined {
  const addressNetwork = network === "mainnet" ? NETWORK : TEST_NETWORK;
  const decoded = Address(addressNetwork).decode(address);
  switch (decoded.type) {
    case "pkh":
      return "p2pkh";
    case "wpkh":
      return "p2wpkh";
    case "tr":
      return "p2tr";
    default:
      return undefined;
  }
}

/**
 * Return whether a runtime value is one of the supported script types.
 */
export function isScriptType(value: unknown): value is ScriptType {
  return typeof value === "string" && Object.hasOwn(SCRIPT_VB, value);
}
