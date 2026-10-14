const SATS_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const RATE_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** Format integer sats with thousands separators. */
export function formatSats(sats: number): string {
  return SATS_FORMAT.format(sats);
}

/** Format a fee rate in sat/vB with at most two decimals. */
export function formatRate(rateSatPerVb: number): string {
  return RATE_FORMAT.format(rateSatPerVb);
}

/** Shorten a txid for table display, keeping both ends. */
export function shortenTxid(txid: string): string {
  return `${txid.slice(0, 8)}…${txid.slice(-8)}`;
}
