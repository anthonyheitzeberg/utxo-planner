import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { usePlannerStore } from "../../src/stores/plannerStore";

const TXID = "0123456789abcdef".repeat(4);
const OTHER_TXID = "fedcba9876543210".repeat(4);

describe("plannerStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts empty with no results", () => {
    const store = usePlannerStore();
    expect(store.utxos).toEqual([]);
    expect(store.verdict).toBeNull();
    expect(store.recommendation).toBeNull();
  });

  it("adds a manual UTXO and rejects invalid or duplicate input", () => {
    const store = usePlannerStore();
    const fields = {
      txid: TXID,
      vout: "0",
      valueSats: "20000",
      scriptType: "p2wpkh",
    };
    expect(store.addManual(fields)).toEqual({ ok: true });
    expect(store.addManual(fields).ok).toBe(false);
    expect(store.addManual({ ...fields, vout: "x" }).ok).toBe(false);
    expect(store.utxos).toHaveLength(1);
  });

  it("flags uneconomical UTXOs at the current rate", () => {
    const store = usePlannerStore();
    store.nowRateInput = "50";
    store.addManual({
      txid: TXID,
      vout: "0",
      valueSats: "100",
      scriptType: "p2wpkh",
    });
    store.addManual({
      txid: TXID,
      vout: "1",
      valueSats: "1000000",
      scriptType: "p2wpkh",
    });
    expect(store.tableRows.map((row) => row.uneconomical)).toEqual([
      true,
      false,
    ]);
  });

  it("imports CSV rows, reporting duplicates against existing UTXOs", () => {
    const store = usePlannerStore();
    store.addManual({
      txid: TXID,
      vout: "0",
      valueSats: "20000",
      scriptType: "p2wpkh",
    });
    store.importCsvText(`${TXID},0,20000,p2wpkh\n${OTHER_TXID},1,30000,p2wpkh`);
    expect(store.utxos).toHaveLength(2);
    expect(store.importedCount).toBe(1);
    expect(store.csvErrors).toEqual([
      { line: 1, message: "This output is already in the list." },
    ]);
  });

  it("produces a verdict and removes or clears UTXOs", () => {
    const store = usePlannerStore();
    for (let vout = 0; vout < 5; vout += 1) {
      store.addManual({
        txid: TXID,
        vout: String(vout),
        valueSats: "50000",
        scriptType: "p2wpkh",
      });
    }
    expect(store.verdict?.kind).toBe("consolidate-now");
    store.removeUtxo(store.tableRows[0].key);
    expect(store.utxos).toHaveLength(4);
    store.clearUtxos();
    expect(store.utxos).toEqual([]);
  });

  it("withholds results when a fee rate is invalid", () => {
    const store = usePlannerStore();
    store.addManual({
      txid: TXID,
      vout: "0",
      valueSats: "50000",
      scriptType: "p2wpkh",
    });
    store.nowRateInput = "abc";
    expect(store.feeErrors).toHaveLength(1);
    expect(store.verdict).toBeNull();
    expect(store.tableRows[0].uneconomical).toBeNull();
  });
});
