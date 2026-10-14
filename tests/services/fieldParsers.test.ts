import { describe, expect, it } from "vitest";
import { InvalidUtxoError } from "../../src/core/types";
import {
  MAX_FEE_RATE_SAT_PER_VB,
  outpointKey,
  parseFeeRate,
  utxoFromFields,
} from "../../src/services/fieldParsers";

const TXID = "0123456789abcdef".repeat(4);

describe("utxoFromFields", () => {
  it("builds a UTXO from trimmed text", () => {
    const utxo = utxoFromFields({
      txid: ` ${TXID} `,
      vout: " 1 ",
      valueSats: "5000",
      scriptType: " P2WPKH ",
    });
    expect(utxo).toMatchObject({
      vout: 1,
      valueSats: 5000,
      scriptType: "p2wpkh",
    });
  });

  it.each([
    ["vout", { vout: "-1", valueSats: "5" }],
    ["vout", { vout: "1.5", valueSats: "5" }],
    ["value", { vout: "0", valueSats: "1e3" }],
    ["value", { vout: "0", valueSats: "" }],
  ])("rejects bad %s", (_name, fields) => {
    expect(() =>
      utxoFromFields({ txid: TXID, scriptType: "p2wpkh", ...fields }),
    ).toThrow(InvalidUtxoError);
  });
});

describe("outpointKey", () => {
  it("is case-insensitive on txid", () => {
    const upper = utxoFromFields({
      txid: TXID.toUpperCase(),
      vout: "0",
      valueSats: "1",
      scriptType: "p2wpkh",
    });
    expect(outpointKey(upper)).toBe(`${TXID}:0`);
  });
});

describe("parseFeeRate", () => {
  it("accepts integers and decimals", () => {
    expect(parseFeeRate("5", "rate")).toEqual({ ok: true, value: 5 });
    expect(parseFeeRate(" 2.5 ", "rate")).toEqual({ ok: true, value: 2.5 });
    expect(parseFeeRate("0", "rate")).toEqual({ ok: true, value: 0 });
  });

  it.each(["", "  ", "abc", "-1", "1e3", "1,5"])("rejects %j", (input) => {
    expect(parseFeeRate(input, "rate").ok).toBe(false);
  });

  it("rejects values above the sanity bound", () => {
    expect(parseFeeRate(String(MAX_FEE_RATE_SAT_PER_VB + 1), "rate").ok).toBe(
      false,
    );
  });
});
