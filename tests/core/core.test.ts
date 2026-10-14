import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  breakEvenRate,
  consolidationCost,
  consolidationSavings,
  isUneconomical,
} from "../../src/core/costs";
import {
  detectAddressScriptType,
  getScriptVbytes,
  isScriptType,
  SCRIPT_VB,
} from "../../src/core/scripts";
import { getPrivacyWarnings } from "../../src/core/privacy";
import { recommendConsolidation } from "../../src/core/strategy";
import {
  InvalidUtxoError,
  validateUtxo,
  type Utxo,
} from "../../src/core/types";

const TXID = "0123456789abcdef".repeat(4);

function makeUtxo(overrides: Partial<Utxo> = {}): Utxo {
  return {
    txid: TXID,
    vout: 0,
    valueSats: 25_000,
    scriptType: "p2wpkh",
    ...overrides,
  };
}

const rateArbitrary = fc
  .integer({ min: 0, max: 10_000 })
  .map((rate) => rate / 10);

describe("script sizes", () => {
  it("returns the standard approximate sizes for every supported script", () => {
    expect(SCRIPT_VB).toEqual({
      p2pkh: { inputVb: 148, outputVb: 34 },
      "p2sh-p2wpkh": { inputVb: 91, outputVb: 32 },
      p2wpkh: { inputVb: 68, outputVb: 31 },
      p2tr: { inputVb: 57.5, outputVb: 43 },
    });
    expect(getScriptVbytes("p2tr").inputVb).toBe(57.5);
  });

  it("recognizes only supported script types", () => {
    expect(isScriptType("p2wpkh")).toBe(true);
    expect(isScriptType("p2wsh")).toBe(false);
    expect(isScriptType(null)).toBe(false);
  });

  it("detects address types without guessing wrapped P2SH", () => {
    expect(
      detectAddressScriptType("1BoatSLRHtKNngkdXEeobR76b53LETtpyT", "mainnet"),
    ).toBe("p2pkh");
    expect(
      detectAddressScriptType("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", "mainnet"),
    ).toBeUndefined();
    expect(() =>
      detectAddressScriptType("1BoatSLRHtKNngkdXEeobR76b53LETtpyT", "testnet4"),
    ).toThrow();
  });

  it("keeps the P2PKH output estimate consistent with a real transaction", () => {
    // Bitcoin genesis coinbase transaction: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b
    expect(getScriptVbytes("p2pkh").outputVb).toBe(34);
  });
});

describe("UTXO validation", () => {
  it("copies a valid UTXO into a typed value", () => {
    expect(validateUtxo(makeUtxo())).toEqual(makeUtxo());
  });

  it.each([
    [{ ...makeUtxo(), txid: "not-a-txid" }],
    [{ ...makeUtxo(), vout: -1 }],
    [{ ...makeUtxo(), valueSats: 0 }],
    [{ ...makeUtxo(), valueSats: 1.5 }],
    [{ ...makeUtxo(), scriptType: "unknown" }],
    [null],
  ])("rejects invalid UTXO values", (value) => {
    expect(() => validateUtxo(value)).toThrow(InvalidUtxoError);
  });
});

describe("cost model", () => {
  it("rounds the consolidation cost up to whole sats", () => {
    expect(consolidationCost([makeUtxo()], 1.001, "p2wpkh")).toBe(
      Math.ceil((10.5 + 68 + 31) * 1.001),
    );
  });

  it("returns zero savings for no inputs and negative savings for a single input", () => {
    expect(consolidationSavings([], 5, 50, "p2wpkh")).toBe(0);
    expect(consolidationSavings([makeUtxo()], 5, 50, "p2wpkh")).toBeLessThan(0);
  });

  it("returns no break-even rate when the plan cannot save on future input size", () => {
    expect(breakEvenRate([], "p2wpkh", 50)).toBeUndefined();
    expect(breakEvenRate([makeUtxo()], "p2wpkh", 50)).toBeUndefined();
    expect(
      breakEvenRate(
        [
          makeUtxo({ scriptType: "p2tr" }),
          makeUtxo({ vout: 1, scriptType: "p2tr" }),
        ],
        "p2pkh",
        50,
      ),
    ).toBeUndefined();
  });

  it("identifies values below the estimated input spend cost", () => {
    const utxo = makeUtxo({ valueSats: 100 });
    expect(isUneconomical(utxo, 2)).toBe(true);
    expect(isUneconomical(utxo, 1)).toBe(false);
  });

  it("rejects invalid fee rates", () => {
    expect(() => consolidationCost([makeUtxo()], -1, "p2wpkh")).toThrow(
      RangeError,
    );
    expect(() =>
      consolidationSavings([makeUtxo()], 1, Number.NaN, "p2wpkh"),
    ).toThrow(RangeError);
  });

  it("matches the model for a two-input native SegWit example", () => {
    const utxos = [makeUtxo(), makeUtxo({ vout: 1 })];
    const cost = consolidationCost(utxos, 2, "p2wpkh");
    expect(cost).toBe(Math.ceil((10.5 + 2 * 68 + 31) * 2));
    expect(consolidationSavings(utxos, 2, 20, "p2wpkh")).toBe(
      2 * 68 * 20 - 68 * 20 - cost,
    );
  });

  it("savings never increase as nowRate increases", () => {
    fc.assert(
      fc.property(rateArbitrary, rateArbitrary, (firstRate, rateDelta) => {
        const utxos = [makeUtxo(), makeUtxo({ vout: 1 })];
        const first = consolidationSavings(utxos, firstRate, 100, "p2wpkh");
        const second = consolidationSavings(
          utxos,
          firstRate + rateDelta,
          100,
          "p2wpkh",
        );
        expect(second).toBeLessThanOrEqual(first);
      }),
    );
  });

  it("savings never decrease as futureRate increases", () => {
    fc.assert(
      fc.property(rateArbitrary, rateArbitrary, (firstRate, rateDelta) => {
        const utxos = [makeUtxo(), makeUtxo({ vout: 1 })];
        const first = consolidationSavings(utxos, 5, firstRate, "p2wpkh");
        const second = consolidationSavings(
          utxos,
          5,
          firstRate + rateDelta,
          "p2wpkh",
        );
        expect(second).toBeGreaterThanOrEqual(first);
      }),
    );
  });

  it("consolidating a single UTXO never yields positive savings", () => {
    fc.assert(
      fc.property(rateArbitrary, rateArbitrary, (nowRate, futureRate) => {
        const savings = consolidationSavings(
          [makeUtxo({ scriptType: "p2pkh" })],
          nowRate,
          futureRate,
          "p2tr",
        );
        expect(savings).toBeLessThanOrEqual(0);
      }),
    );
  });

  it("plugging breakEvenRate back in yields savings within one sat", () => {
    fc.assert(
      fc.property(rateArbitrary, (futureRate) => {
        const utxos = [makeUtxo(), makeUtxo({ vout: 1 })];
        const rate = breakEvenRate(utxos, "p2wpkh", futureRate);
        expect(rate).toBeDefined();
        expect(
          Math.abs(
            consolidationSavings(utxos, rate ?? 0, futureRate, "p2wpkh"),
          ),
        ).toBeLessThanOrEqual(1);
      }),
    );
  });
});

describe("privacy warnings", () => {
  it("warns about common ownership and mixed script types", () => {
    expect(
      getPrivacyWarnings([
        makeUtxo(),
        makeUtxo({ vout: 1, scriptType: "p2tr" }),
      ]),
    ).toHaveLength(2);
  });

  it("does not warn for no inputs or one input", () => {
    expect(getPrivacyWarnings([])).toEqual([]);
    expect(getPrivacyWarnings([makeUtxo()])).toEqual([]);
  });
});

describe("recommendation stub", () => {
  it("provides a basic recommendation for all supplied inputs", () => {
    const result = recommendConsolidation([makeUtxo(), makeUtxo({ vout: 1 })], {
      nowRateSatPerVb: 1,
      futureRateSatPerVb: 100,
      consolidationScriptType: "p2wpkh",
    });
    expect(result.shouldConsolidate).toBe(true);
    expect(result.estimatedSavingsSats).toBeGreaterThan(0);
    expect(result.breakEvenRateSatPerVb).toBeDefined();
  });
});
