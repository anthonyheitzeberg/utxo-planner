import { describe, expect, it } from "vitest";
import { getVerdict, recommendConsolidation } from "../../src/core/strategy";
import { createUtxo } from "../../src/core/types";
import type { FeeEnvironment, Utxo } from "../../src/core/types";

const TXID = "0123456789abcdef".repeat(4);

function utxos(count: number, valueSats = 50_000): readonly Utxo[] {
  return Array.from({ length: count }, (_, vout) =>
    createUtxo({ txid: TXID, vout, valueSats, scriptType: "p2wpkh" }),
  );
}

function verdictFor(list: readonly Utxo[], now: number, future: number) {
  const env: FeeEnvironment = {
    nowRateSatPerVb: now,
    futureRateSatPerVb: future,
    consolidationScriptType: "p2wpkh",
  };
  return getVerdict(list, env, recommendConsolidation(list, env));
}

describe("getVerdict", () => {
  it("says not worth it for a single UTXO", () => {
    expect(verdictFor(utxos(1), 2, 100).kind).toBe("not-worth-it");
  });

  it("says consolidate now when savings are positive", () => {
    const verdict = verdictFor(utxos(10), 2, 100);
    expect(verdict.kind).toBe("consolidate-now");
    expect(verdict.reasons.length).toBeGreaterThan(0);
  });

  it("says wait when current fees exceed break-even", () => {
    expect(verdictFor(utxos(10), 100, 2).kind).toBe("wait");
  });

  it("says not worth it when the future rate is zero", () => {
    expect(verdictFor(utxos(10), 2, 0).kind).toBe("not-worth-it");
  });
});
