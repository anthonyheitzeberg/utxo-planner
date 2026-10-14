import { InvalidUtxoError, type Utxo } from "../core/types";
import { outpointKey, utxoFromFields } from "./fieldParsers";

/** Expected CSV header columns. */
export const CSV_HEADER: readonly string[] = [
  "txid",
  "vout",
  "value_sats",
  "script_type",
];

/** Upper bound on pasted or uploaded CSV size, in UTF-16 characters. */
export const MAX_CSV_CHARS = 1_000_000;

/** Upper bound on data rows accepted from one CSV. */
export const MAX_CSV_ROWS = 5_000;

/** A valid row and its 1-based line number. */
export interface CsvRow {
  readonly line: number;
  readonly utxo: Utxo;
}

/** A rejected row and its 1-based line number. */
export interface CsvRowError {
  readonly line: number;
  readonly message: string;
}

export interface CsvParseResult {
  readonly rows: readonly CsvRow[];
  readonly errors: readonly CsvRowError[];
}

const LINE_BREAK = /\r\n|\n|\r/;

/**
 * Parse `txid,vout,value_sats,script_type` CSV text. The header line is
 * optional. Never throws on bad rows; each is reported with its line number.
 * Error messages never echo cell contents. Quoted fields are not supported.
 */
export function parseCsv(text: string): CsvParseResult {
  if (text.length > MAX_CSV_CHARS) {
    return {
      rows: [],
      errors: [
        {
          line: 1,
          message: `Input is too large (limit ${MAX_CSV_CHARS} characters).`,
        },
      ],
    };
  }

  const rows: CsvRow[] = [];
  const errors: CsvRowError[] = [];
  const firstLineByKey = new Map<string, number>();
  let dataRowCount = 0;
  let sawFirstContentLine = false;

  const lines = text.split(LINE_BREAK);
  for (const [index, rawLine] of lines.entries()) {
    const line = index + 1;
    if (rawLine.trim() === "") {
      continue;
    }
    const cells = rawLine.split(",").map((cell) => cell.trim());

    if (!sawFirstContentLine) {
      sawFirstContentLine = true;
      if (cells[0].toLowerCase() === CSV_HEADER[0]) {
        if (
          cells.length === CSV_HEADER.length &&
          cells.every((cell, i) => cell.toLowerCase() === CSV_HEADER[i])
        ) {
          continue;
        }
        errors.push({
          line,
          message: `Header must be exactly: ${CSV_HEADER.join(",")}.`,
        });
        continue;
      }
    }

    dataRowCount += 1;
    if (dataRowCount > MAX_CSV_ROWS) {
      errors.push({
        line,
        message: `Too many rows (limit ${MAX_CSV_ROWS}). Remaining rows were ignored.`,
      });
      break;
    }
    if (cells.length !== CSV_HEADER.length) {
      errors.push({
        line,
        message: `Expected ${CSV_HEADER.length} columns but found ${cells.length}.`,
      });
      continue;
    }

    try {
      const [txid, vout, valueSats, scriptType] = cells;
      const utxo = utxoFromFields({ txid, vout, valueSats, scriptType });
      const key = outpointKey(utxo);
      const firstLine = firstLineByKey.get(key);
      if (firstLine !== undefined) {
        errors.push({
          line,
          message: `Duplicate of the output on line ${firstLine}.`,
        });
        continue;
      }
      firstLineByKey.set(key, line);
      rows.push({ line, utxo });
    } catch (error) {
      if (error instanceof InvalidUtxoError) {
        errors.push({ line, message: error.message });
      } else {
        throw error;
      }
    }
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({
      line: 1,
      message: `No rows found. Expected lines like: ${CSV_HEADER.join(",")}.`,
    });
  }
  return { rows, errors };
}
