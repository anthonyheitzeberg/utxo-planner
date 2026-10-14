import { describe, expect, it } from "vitest";
import {
  CSV_HEADER,
  MAX_CSV_ROWS,
  parseCsv,
} from "../../src/services/csvParser";

const TXID_A = "0123456789abcdef".repeat(4);
const TXID_B = "fedcba9876543210".repeat(4);

describe("parseCsv", () => {
  it("parses valid rows with a header", () => {
    const result = parseCsv(
      `${CSV_HEADER.join(",")}\n${TXID_A},0,25000,p2wpkh\n${TXID_B},1,10000,p2tr`,
    );
    expect(result.errors).toEqual([]);
    expect(result.rows.map((row) => row.line)).toEqual([2, 3]);
    expect(result.rows[0].utxo.valueSats).toBe(25000);
    expect(result.rows[1].utxo.scriptType).toBe("p2tr");
  });

  it("accepts input without a header and CRLF line breaks", () => {
    const result = parseCsv(
      `${TXID_A},0,25000,p2wpkh\r\n\r\n${TXID_B},2,5000,p2pkh\r\n`,
    );
    expect(result.errors).toEqual([]);
    expect(result.rows.map((row) => row.line)).toEqual([1, 3]);
  });

  it("reports a wrong column count with its line number", () => {
    const result = parseCsv(`${TXID_A},0,25000`);
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      { line: 1, message: "Expected 4 columns but found 3." },
    ]);
  });

  it("reports invalid fields per line and keeps valid rows", () => {
    const result = parseCsv(
      [
        CSV_HEADER.join(","),
        `${TXID_A},0,25000,p2wpkh`,
        `abc,0,25000,p2wpkh`,
        `${TXID_B},x,25000,p2wpkh`,
        `${TXID_B},1,0,p2wpkh`,
        `${TXID_B},1,100,p2xyz`,
      ].join("\n"),
    );
    expect(result.rows).toHaveLength(1);
    expect(result.errors.map((error) => error.line)).toEqual([3, 4, 5, 6]);
    expect(result.errors[0].message).toContain("64");
  });

  it("flags duplicate outputs with the first line", () => {
    const result = parseCsv(
      `${TXID_A},0,25000,p2wpkh\n${TXID_A.toUpperCase()},0,30000,p2wpkh`,
    );
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toEqual([
      { line: 2, message: "Duplicate of the output on line 1." },
    ]);
  });

  it("rejects a malformed header", () => {
    const result = parseCsv(`txid,vout,value\n${TXID_A},0,25000,p2wpkh`);
    expect(result.errors).toEqual([
      {
        line: 1,
        message: "Header must be exactly: txid,vout,value_sats,script_type.",
      },
    ]);
    expect(result.rows).toHaveLength(1);
  });

  it("reports empty input", () => {
    const result = parseCsv("  \n\n");
    expect(result.rows).toEqual([]);
    expect(result.errors[0].message).toMatch(/No rows found/);
  });

  it("does not echo cell contents in messages", () => {
    const secret = "SECRETVALUE";
    const result = parseCsv(`${secret},0,1,p2wpkh`);
    expect(JSON.stringify(result.errors)).not.toContain(secret);
  });

  it("stops at the row limit", () => {
    const lines = Array.from(
      { length: MAX_CSV_ROWS + 1 },
      (_, i) => `${TXID_A},${i},1000,p2wpkh`,
    );
    const result = parseCsv(lines.join("\n"));
    expect(result.rows).toHaveLength(MAX_CSV_ROWS);
    expect(result.errors[0].message).toMatch(/Too many rows/);
  });
});
