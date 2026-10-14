# UTXO Planner: Copilot Handoff

This file transfers everything decided in the planning conversation so the build can continue in GitHub Copilot on a local machine. It has two parts:

1. **Transferred knowledge:** what the project is, why it is built this way, the domain logic, decisions made, and what to verify. Look back here whenever context is lost.
2. **Build prompts:** the next Copilot prompts, in order.

Companion files in the repo: `AGENTS.md`, `README.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `.github/workflows/deploy.yml`, `.github/dependabot.yml`. If anything here conflicts with `AGENTS.md`, `AGENTS.md` wins.

---

# PART 1: TRANSFERRED KNOWLEDGE

## 1. Project in one paragraph

**UTXO Planner** is a free, open-source, fully client-side web tool, hosted on GitHub Pages, that tells Bitcoin users whether and when to consolidate their UTXOs. It compares the fee cost of consolidating now against the fee cost of spending many small UTXOs later, outputs net savings and a break-even fee rate, flags uneconomical UTXOs, and warns about the privacy cost. It works with real Bitcoin networks (mainnet, testnet4, signet) via the mempool.space API. It only plans. It never signs, broadcasts, or touches keys. The owner also uses it as a portfolio and resume project, so quality, tests, and documentation matter.

## 2. Status at handoff

**Exists (documentation and config only, no application code yet):**

- `AGENTS.md`, `README.md`
- `.github/copilot-instructions.md`
- `.github/instructions/`: `core`, `services`, `vue`, `tests`, `design`
- `.github/workflows/deploy.yml` (lint, typecheck, test, build, deploy to Pages)
- `.github/dependabot.yml` (npm and GitHub Actions, weekly)

**Does not exist yet:** `package.json`, any source code, tests, `vite.config.ts`, `LICENSE`, `package-lock.json`.

**Placeholders to replace:** `<your-username>` and `<repo-name>` in `README.md`.

## 3. Decision log (and why)

| Decision | Reason |
|---|---|
| Started in Python, **switched to TypeScript + Vue** | The tool must be hosted on GitHub Pages for everyone to use. Pages is static hosting, so logic runs in the browser. Earlier Python-specific files were deleted. |
| **No backend** | Nothing to secure or pay for, and it supports the "never touches your keys, runs in your browser" message. |
| Vue 3, Vite, Pinia, Tailwind, `<script setup lang="ts">` | Owner's chosen stack; fast builds; easy Pages deploy. |
| `@scure/btc-signer` for address and script parsing | Browser-friendly with no Node polyfills (bitcoinjs-lib often needs them). Verify it still fits when installing. |
| Vitest + `fast-check` | Unit tests plus property tests for the cost model. |
| **Pure `src/core`** | Financial logic stays framework-free, deterministic, and easy to test and audit. |
| **Integer sats everywhere** | Avoids floating-point money bugs. The full supply (about 2.1e15 sats) fits in `Number.MAX_SAFE_INTEGER` (about 9e15). |
| Round costs **up** (`Math.ceil`) at the final sats conversion only | Vbyte sizes like 57.5 produce fractions; rounding early compounds errors. |
| Default input mode is **manual or CSV** | Most private: nothing leaves the browser. |
| Address lookup behind an **acknowledgment gate** | Addresses are sent to the API host (mempool.space). Must be consented to. Custom base URL supported. |
| **xpubs rejected** | Pasting an xpub reveals a user's entire wallet history. |
| No analytics, cookies, telemetry | Privacy by build; trust signal. |
| Hash routing (or single page) | History-mode routing breaks on static hosting. |
| Dev on **testnet4 / signet** first | Real network behavior, worthless coins. |
| Dependabot excludes `@scure/*` and `@noble/*` from groups | Crypto libraries should always get their own reviewed PR. An earlier draft used `ignore`, which would have blocked security updates, and was corrected. |
| Design follows https://floodwatch-ph-five.vercel.app/ | Owner's chosen look and feel. Only the theme color `#1a6bb5` was verified; layout and style were inferred from text. Refine with a screenshot. |

## 4. Domain knowledge (plain language)

**UTXO:** Bitcoin has no single balance. A wallet holds separate pieces (unspent transaction outputs), like bills and coins. Spending uses whole pieces and returns **change** as a new piece.

**Fees depend on size, not amount.** Miners charge for block space, measured in **virtual bytes (vB)**. Fee = size (vB) × **fee rate** (sat/vB). Every input spent adds size, so spending many small UTXOs is expensive; sending $10 from 20 UTXOs costs far more than $10,000 from one.

**Dust / uneconomical UTXO:** a UTXO whose value is less than the fee to spend it at the current rate. It is effectively stuck until fees drop.

**Consolidation:** send many UTXOs to yourself in one transaction, producing one larger UTXO. Pay a fee now so every future spend is cheaper. It is a **bet on future fee rates**: worthwhile when the current rate is meaningfully lower than the rate you expect to face later.

**Fee rate fluctuates** with mempool congestion (the queue of unconfirmed transactions). Quiet periods are the best time to consolidate.

**Script types** (address formats) differ in size: legacy P2PKH is bulkiest, then wrapped SegWit (P2SH-P2WPKH), native SegWit (P2WPKH), and Taproot (P2TR key path) is leanest. Consolidating old bulky inputs into a modern lean output saves extra. Avoid mixing script types: it costs more and fingerprints the wallet.

**Privacy cost:** spending UTXOs together signals common ownership (the **common-input-ownership heuristic**), letting analysts cluster addresses. Consolidation trades lower fees for lower privacy. Users who keep funds separate on purpose should be warned. The tool must always surface this tradeoff.

**When consolidation is a bad idea:** fees are high now; only one or two UTXOs; UTXOs already large and cheap to spend; user values unlinked funds; user will spend them separately and soon anyway.

## 5. Business rules and cost model

Approximate sizes (vB). **Verify against real transactions and current references before relying on them.**

| Script type | Input vB | Output vB |
|---|---|---|
| `p2pkh` | 148 | 34 |
| `p2sh-p2wpkh` | 91 | 32 |
| `p2wpkh` | 68 | 31 |
| `p2tr` (key path) | 57.5 | 43 |

Transaction overhead is about 10.5 vB. vB = weight units / 4.

```
inputVbSum    = sum(inputVb of each selected UTXO)
costNow       = ceil((OVERHEAD_VB + inputVbSum + outputVb) * nowRate)
laterWithout  = inputVbSum * futureRate
laterWith     = consolidatedInputVb * futureRate     // input size of the single new UTXO
savings       = laterWithout - laterWith - costNow   // positive means consolidate
```

**Break-even rate** (where `savings = 0`), derived algebraically:

```
breakEvenNowRate = ((inputVbSum - consolidatedInputVb) * futureRate)
                   / (OVERHEAD_VB + inputVbSum + outputVb)
```

Rules:

1. Positive net savings means consolidating wins; otherwise wait.
2. Present break-even as "consolidate when fees are below X sat/vB".
3. More UTXOs means more savings, all else equal.
4. Consolidating a **single** UTXO never produces positive savings.
5. Savings rise with `futureRate` and fall with `nowRate`.
6. Flag a UTXO as uneconomical when `value < inputVb * nowRate` (it costs more to spend than it holds).
7. The **future rate** is an estimate: derive a suggestion from historical fee percentiles (for example 30/90-day median), always user-overridable.
8. Warn on mixed script types and on common-input-ownership linkage.
9. Because of `ceil`, "break-even yields about zero" holds within rounding tolerance, not exactly.

## 6. Hard rules (never violate)

1. Never ask for, accept, store, or log seeds, mnemonics, private keys, xprv, or xpubs.
2. `src/core` is pure TypeScript: no Vue, `fetch`, DOM, storage, globals, `Date.now()`, or randomness.
3. All network code lives in `src/services` and is mockable. Tests pass offline.
4. Gate any request that sends addresses to a third party behind explicit user acknowledgment.
5. Integer sats; round costs up; fee rates in sat/vB.
6. No telemetry, analytics, cookies, or third-party scripts.
7. Do not invent Bitcoin facts or API endpoints. Add a `TODO` with a source link when unsure.
8. No secrets in the repo: it is a static public site.

## 7. Architecture

```
src/
  core/        PURE: types.ts, scripts.ts, costs.ts, strategy.ts, privacy.ts
  services/    mempoolClient.ts, csvParser.ts   (all I/O)
  stores/      Pinia
  components/  small, typed, accessible
  views/
tests/
```

Dependency direction: `views/components -> stores -> services and core`. `core` imports nothing from the app.

Input modes: (1) manual and CSV (default), (2) address lookup via mempool.space with acknowledgment gate, (3) fee data (current recommended fees and historical percentiles) for the future-rate suggestion.

CSV format: `txid,vout,value_sats,script_type`. Validate: 64-hex `txid`, integer `vout >= 0`, positive integer `value_sats`, known `script_type`. Report errors per row with line numbers.

## 8. Design brief (summary)

Reference: https://floodwatch-ph-five.vercel.app/. Calm, credible, data-journalism tone. Primary blue `#1a6bb5`. Lowercase eyebrow labels and nav. Page flow: nav, hero (plain-language headline plus three short value props), CTAs, stat row of large numbers, content sections, tool cards, disclaimer line, footer with **What this isn't** and **Found an error?**. Conservative copy ("estimated savings", "warrants checking"). Mobile-first, dark mode, WCAG AA. Full detail in `.github/instructions/design.instructions.md`. Borrow structure and tone only; use original copy, wordmark, and branding, and imply no affiliation.

## 9. Open items to verify (do not assume)

- [ ] Vbyte table against real transactions and a current reference.
- [ ] mempool.space endpoint paths and per-network URL prefixes (mainnet, testnet4, signet) against the official API docs.
- [ ] Historical fee data: which endpoint gives usable percentiles, and its rate limits.
- [ ] CORS behavior of the public mempool.space API from a browser, and for custom instances.
- [ ] Current `@scure/btc-signer` API for address decoding and script-type detection.
- [ ] GitHub Actions versions in `deploy.yml` (checkout v4, setup-node v4, configure-pages v5, upload-pages-artifact v3, deploy-pages v4) and whether newer majors exist.
- [ ] Dependabot `cooldown` option is accepted by GitHub; remove it if flagged.
- [ ] Whether the local Copilot setup reads `.github/instructions/*.instructions.md` (`applyTo` comma-separated globs).
- [ ] Visual details of the reference site (fonts, spacing, cards): get a screenshot.
- [ ] Add a `LICENSE` file (README says MIT) and fill README placeholders.

## 10. Working agreement with Copilot

1. Read `AGENTS.md` and this file before starting.
2. Work in small, reviewable steps; one concern per commit.
3. Write tests alongside code.
4. Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` and report results.
5. State assumptions explicitly; do not guess Bitcoin facts.
6. Update `README.md` and tick the roadmap only when a feature is built and tested.
7. The human owner reviews every diff and must be able to explain every line (this is a resume project).

---

# PART 2: BUILD PROMPTS

Run these in order in Copilot Agent mode. Review, run checks, and commit between each.

## Prompt 1: Scaffold, core logic, and design shell

```
Read AGENTS.md and docs/COPILOT_HANDOFF.md first, and follow them strictly,
especially the hard rules and the design instructions.

Build step 1 of UTXO Planner. Do ONLY this:

1. Scaffold a Vite + Vue 3 + TypeScript (strict) project in the repo root with
   Tailwind CSS, Pinia, Vitest, fast-check, Vue Test Utils, ESLint, Prettier,
   and vue-tsc. Add npm scripts: dev, build, test, lint, typecheck. Make sure
   package-lock.json is created. Set Vite `base` to '/<repo-name>/' and use
   hash routing.
2. Implement src/core with strict types and doc comments stating units:
   - types.ts: Utxo, ScriptType, FeeEnvironment, Recommendation
   - scripts.ts: SCRIPT_VB table and OVERHEAD_VB constant, with a TODO and
     source link for verifying the sizes
   - costs.ts: consolidationCost, consolidationSavings, breakEvenRate,
     isUneconomical (formulas are in docs/COPILOT_HANDOFF.md section 5)
   - strategy.ts and privacy.ts: typed stubs with TODOs
   - a createUtxo validator that throws InvalidUtxoError on bad input
3. Write tests/core tests: unit tests for every exported function, plus these
   fast-check properties:
   - savings never increase as nowRate increases
   - savings never decrease as futureRate increases
   - consolidating a single UTXO never yields positive savings
   - plugging breakEvenRate back in yields savings of about zero
     (within rounding tolerance, since costs use Math.ceil)
4. Set up Tailwind theme tokens per .github/instructions/design.instructions.md
   (primary #1a6bb5, neutrals, semantic colors, dark mode).
5. Build static components SiteNav, HeroSection, ValueProp, StatRow,
   SectionBlock, DisclaimerBar, and SiteFooter, and a home view assembling
   them with placeholder copy that is clearly marked as placeholder. Include
   the always-visible line "This tool never asks for keys. It runs in your
   browser." and a "What this isn't" footer block.
6. Do not implement CSV import, API calls, or the planner UI yet.

Then run lint, typecheck, test, and build. Fix problems. Summarize what you
built, every assumption you made, and anything from the "Open items to verify"
list that you touched.
```

## Prompt 2: Input and results UI

```
Read AGENTS.md and docs/COPILOT_HANDOFF.md. Build the planner view:
- Manual UTXO entry form and CSV upload/paste, using a pure csvParser in
  src/services that returns { rows, errors } with per-row line numbers.
- A UTXO table showing value, script type, and per-UTXO viability
  (uneconomical flag at the current rate).
- Inputs for current fee rate and expected future fee rate (static for now),
  and an output script type selector.
- A results panel with net savings, break-even rate, and a plain-language
  verdict ("consolidate now", "wait", "not worth it") with the reasoning.
- Loading, empty, and error states. Accessible labels and keyboard support.
- Component tests for CSV validation messages.
All logic via src/core through a Pinia store. No network calls yet.
```

## Prompt 3: Network layer

```
Read AGENTS.md, docs/COPILOT_HANDOFF.md, and services.instructions.md. Add
src/services/mempoolClient.ts:
- Network selector (mainnet, testnet4, signet) and configurable, validated
  base URL (https, or http only for localhost). Note the CORS requirement.
- Injectable fetch, AbortController timeout, typed errors, 429 and 5xx
  handling, in-memory TTL cache, debounce for user-triggered calls.
- Treat responses as unknown and validate them before use.
- Fetch current recommended fees and show them in the UI with loading and
  error states.
Check endpoint paths and network prefixes against the official mempool.space
API docs; do not guess. Add a TODO with the doc link where unsure.
Mock all HTTP in tests, covering success, timeout, HTTP error, 429, and
malformed JSON.
```

## Prompt 4: Historical fees and future-rate suggestion

```
Use historical fee-rate data to suggest a future fee rate. Let the user choose
a percentile (for example median or 25th) and a window (30 or 90 days), with a
manual override always available. Keep the percentile calculation pure in
src/core and the fetching in src/services. Explain the estimate and its
uncertainty in the UI. Add unit and property tests.
```

## Prompt 5: Address lookup with privacy gate

```
Add address lookup via the mempool.space UTXO endpoint. Before the first
lookup, show a clear warning that the addresses are sent to the API host, and
require explicit acknowledgment; block the request until acknowledged. Support
the custom base URL. Detect script type from the address with
@scure/btc-signer. Reject xpubs, seeds, and private keys with a clear
explanation. Do not log or persist addresses. Add component tests for the
acknowledgment gate.
```

## Prompt 6: Privacy warnings panel

```
Implement src/core/privacy.ts and a prominent warnings panel covering
common-input-ownership linkage, mixed script types, and the option to
consolidate in smaller same-type batches. Plain language, not hidden in
tooltips. Unit tests for each warning condition.
```

## Prompt 7: Polish and release

```
Add a fee-history chart, export or share of the plan (no data sent anywhere),
a methodology page with the cost model and limitations, FAQ, and privacy page.
Run an accessibility and Lighthouse pass. Add real screenshots and a CI badge
to the README, tick completed roadmap items, add a LICENSE, and fill the
README placeholders. Confirm the Pages deployment works end to end.
```

---

# PART 3: QUICK REFERENCE

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint and Prettier |
| `npm run typecheck` | `vue-tsc --noEmit` |

**Glossary:** UTXO (spendable piece), sat (1e-8 BTC), vB (virtual byte), fee rate (sat/vB), mempool (unconfirmed queue), change (leftover piece), dust (not worth spending), break-even rate (fee rate where consolidating exactly pays for itself), common-input-ownership (inputs spent together assumed to share an owner).

**Disclaimer to keep in the product:** this is a planning aid, not financial advice. Estimates depend on assumed sizes and a guessed future fee rate. Always review a transaction in your own wallet before signing.