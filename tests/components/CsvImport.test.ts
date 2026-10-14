// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import CsvImport from "../../src/components/CsvImport.vue";
import UtxoForm from "../../src/components/UtxoForm.vue";

const TXID = "0123456789abcdef".repeat(4);

function mountCsv() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(CsvImport, { global: { plugins: [pinia] } });
}

async function submitCsv(text: string) {
  const wrapper = mountCsv();
  await wrapper.get("textarea").setValue(text);
  await wrapper
    .findAll("button")
    .find((button) => button.text().includes("Add rows"))!
    .trigger("click");
  return wrapper;
}

describe("CsvImport", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("labels its inputs", () => {
    const wrapper = mountCsv();
    expect(wrapper.get("label[for=csv-text]").text()).toBe("Paste CSV");
    expect(wrapper.find("label[for=csv-file]").exists()).toBe(true);
  });

  it("shows per-line validation messages", async () => {
    const wrapper = await submitCsv(
      `${TXID},0,25000,p2wpkh\nabc,0,25000,p2wpkh\n${TXID},1,0,p2wpkh\n${TXID},2,5`,
    );
    const alert = wrapper.get("[role=alert]").text();
    expect(alert).toContain("3 row problem(s) found");
    expect(alert).toContain(
      "Line 2: Transaction ID must be 64 hexadecimal characters.",
    );
    expect(alert).toContain("Line 3:");
    expect(alert).toContain("Line 4: Expected 4 columns but found 3.");
    expect(wrapper.get("[role=status]").text()).toContain("Added 1 UTXO(s).");
  });

  it("clears the textarea after a fully successful import", async () => {
    const wrapper = await submitCsv(`${TXID},0,25000,p2wpkh`);
    expect(wrapper.find("[role=alert]").exists()).toBe(false);
    expect((wrapper.get("textarea").element as HTMLTextAreaElement).value).toBe(
      "",
    );
  });

  it("explains empty input", async () => {
    const wrapper = await submitCsv("   ");
    expect(wrapper.get("[role=alert]").text()).toContain(
      "Line 1: No rows found",
    );
  });
});

describe("UtxoForm", () => {
  it("shows a validation error for a bad txid", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(UtxoForm, { global: { plugins: [pinia] } });
    await wrapper.get("#manual-txid").setValue("abc");
    await wrapper.get("#manual-value").setValue("1000");
    await wrapper.get("form").trigger("submit");
    expect(wrapper.get("[role=alert]").text()).toContain("64 hexadecimal");
  });
});
