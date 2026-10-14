# UTXO Planner

[![CI](https://github.com/anthonyheitzeberg/utxo-planner/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/anthonyheitzeberg/utxo-planner/actions/workflows/deploy.yml)
[![Project status: in development](https://img.shields.io/badge/status-in%20development-orange)](#limitations)
[![Dependabot: enabled](https://img.shields.io/badge/Dependabot-enabled-0256D2?logo=dependabot&logoColor=white)](./.github/dependabot.yml)

UTXO Planner is an open-source, client-side tool for evaluating when and how to
consolidate Bitcoin UTXOs. Consolidation pays a transaction fee now to combine
inputs, with the aim of reducing the cost of future spends. The app has a pure
cost-model core, a placeholder landing page, and a planner view (`#/planner`)
where you enter UTXOs manually or via CSV, set static fee-rate assumptions, and
see a verdict, net savings, and break-even rate. It makes no network requests.

> **Security:** This tool never asks for keys. It runs in your browser. It
> never signs or broadcasts transactions. It has no backend, analytics,
> telemetry, or cookies. Do not enter seeds, mnemonics, private keys, xprvs, or
> xpubs. An xpub can expose a wallet's entire transaction history.

## Cost model

Amounts are integer satoshis and fee rates are sat/vB. For a consolidation
transaction with one output:

```text
costNow       = ceil((10.5 vB + sum(inputVb) + outputVb) * nowRate)
laterWithout  = sum(inputVb) * futureRate
laterWith     = consolidatedInputVb * futureRate
savings       = laterWithout - laterWith - costNow
```

Positive savings mean the estimated future input-fee reduction exceeds the
consolidation fee. Costs round up to whole sats. A one-input plan has no future
input-size savings. The break-even sat/vB rate is the continuous fee rate at
which the unrounded savings are zero; when plugged into the integer-rounded
cost model the result can differ by less than one sat.

The input/output sizes in [scripts.ts](./src/core/scripts.ts) are rough
estimates, not transaction-specific guarantees:

| Script type   | Input (vB) | Output (vB) |
| ------------- | ---------: | ----------: |
| P2PKH         |        148 |          34 |
| P2SH-P2WPKH   |         91 |          32 |
| P2WPKH        |         68 |          31 |
| P2TR key path |       57.5 |          43 |

Signature and script details can change actual transaction size. P2SH addresses
are not automatically classified as wrapped SegWit: an address alone does not
reveal the redeem script.

## Privacy and data

Manual entry and CSV input are the default, most private modes. Data stays in
memory in the page and is never stored or sent. CSV columns are
`txid,vout,value_sats,script_type` (header optional, no quoted fields); errors
are reported per line. Address lookup is not implemented. When it is
added, it must explicitly disclose that addresses are sent to the selected API
host and require acknowledgment before the first lookup. A custom mempool
instance must send appropriate CORS headers. Do not enter xpubs: they reveal
wallet history, even when no private key is disclosed.

Consolidating inputs can publicly link them through the common-input-ownership
heuristic. Mixing script types may also fingerprint wallet behavior. The core
privacy helper surfaces both conditions, and the planner view displays them.

## Networks and data sources

The app uses a small hand-written hash router (`#/` and `#/planner`). No network
selector is included yet. The app does not connect to mempool.space or retrieve
current or historical fee data. No API endpoint or network prefix is used by
this scaffold; verify paths against the
[official mempool.space REST API documentation](https://mempool.space/docs/api/rest)
when implementing the service.

## Project layout

```text
src/
  core/        pure TypeScript types, script sizes, cost model, strategy and privacy
  services/    pure CSV and field parsers (no network yet)
  stores/      Pinia planner store
  components/  landing-page and planner components
  views/       home and planner views
tests/         core, services, store, and component tests
```

The `src/core` modules have no Vue, DOM, storage, or network access. Vite is
configured for the GitHub Pages project path `/utxo-planner/`. Tailwind theme
tokens provide light and dark surfaces, text, borders, and semantic colors.

## Getting started

Requires Node.js 22.12 or later and npm.

```bash
git clone https://github.com/anthonyheitzeberg/utxo-planner.git
cd utxo-planner
npm install
npm run dev
```

| Command             | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Start the local development server                    |
| `npm run build`     | Type-check and create the production build in `dist/` |
| `npm run test`      | Run unit and fast-check property tests once           |
| `npm run lint`      | Run ESLint and Prettier checks                        |
| `npm run typecheck` | Run `vue-tsc --noEmit`                                |

## Deploying

The GitHub Actions workflow at
[.github/workflows/deploy.yml](./.github/workflows/deploy.yml) runs lint,
type-checking, tests, and the production build. Pushes to `main` deploy the
`dist/` artifact to GitHub Pages. Set the repository's Pages source to **GitHub
Actions** in repository settings.

## Limitations

- Fee rates are static user inputs (placeholder defaults of 5 and 20 sat/vB),
  not live data.
- Sizes are approximations; actual transaction sizes depend on scripts and
  signatures.
- Future fee rates are uncertain. A later historical estimate cannot predict
  future fees and must remain user-overridable.
- Multisig, complex scripts, and Taproot script-path spends are not modeled.
- Savings are estimated in sats, not fiat, and omit tax consequences.
- This is a planning aid, not financial advice. Review any transaction in your
  wallet before signing.
