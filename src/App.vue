<script setup lang="ts">
import { ref } from "vue";

const selectedNetwork = ref("testnet4");
</script>

<template>
  <div class="site">
    <header class="site-header">
      <div class="header-inner">
        <a class="wordmark" href="#top" aria-label="UTXO Planner home">
          UTXO Planner
        </a>

        <nav class="primary-nav" aria-label="Main navigation">
          <a href="#top">overview</a>
          <a href="#cost-model">cost model</a>
          <a href="#privacy">privacy</a>
          <a href="https://github.com/anthonyheitzeberg/utxo-planner">
            github
          </a>
        </nav>

        <label class="network-picker" for="network">
          <span>network</span>
          <select id="network" v-model="selectedNetwork">
            <option value="mainnet">mainnet</option>
            <option value="testnet4">testnet4</option>
            <option value="signet">signet</option>
          </select>
        </label>
      </div>
    </header>

    <main id="top" class="page-content">
      <section class="hero" aria-labelledby="page-title">
        <p class="eyebrow">
          UTXO PLANNER <span aria-hidden="true">·</span> BITCOIN FEE PLANNING
        </p>
        <h1 id="page-title">Consolidate when the fee is right.</h1>
        <p class="hero-copy">
          Consolidation is a bet: pay a fee now to combine small inputs, so a
          future spend may cost less. UTXO Planner compares that cost with the
          fee rate you expect later—and makes the privacy tradeoff clear.
        </p>

        <div class="principles" aria-label="Project principles">
          <article class="principle">
            <p class="eyebrow">THE MODEL</p>
            <p>
              Transparent estimates in satoshis, with costs rounded up and
              assumptions kept visible.
            </p>
          </article>
          <article class="principle">
            <p class="eyebrow">PRIVATE BY DESIGN</p>
            <p>
              Planning runs in your browser. Address lookups will require
              explicit consent before data is sent.
            </p>
          </article>
          <article class="principle">
            <p class="eyebrow">IN DEVELOPMENT</p>
            <p>
              The core cost model is taking shape. CSV import, live fees, and
              the planner interface are still to come.
            </p>
          </article>
        </div>

        <div class="hero-actions">
          <a class="button button-primary" href="#cost-model">
            Explore the cost model
          </a>
          <a
            class="button button-secondary"
            href="https://github.com/anthonyheitzeberg/utxo-planner"
          >
            View the project on GitHub
          </a>
        </div>
        <p class="hero-note">
          Open source. No accounts, analytics, or cookies.
          <a href="#privacy"
            >How privacy works <span aria-hidden="true">→</span></a
          >
        </p>
      </section>

      <section
        id="cost-model"
        class="detail-section"
        aria-labelledby="model-title"
      >
        <p class="eyebrow">THE COST MODEL</p>
        <h2 id="model-title">A simple question, made explicit.</h2>
        <p>
          A consolidation is worthwhile only when the expected reduction in
          future input fees is greater than the fee paid now. All amounts are
          integer sats; fee rates are sat/vB.
        </p>
        <pre
          class="formula"
        ><code>cost now       = ceil((overhead + input vB + output vB) × current rate)
future savings = (inputs before − input after) × expected future rate
net savings    = future savings − cost now</code></pre>
        <p>
          The break-even rate is the current sat/vB rate where estimated net
          savings reach zero. It is a planning estimate, not a promise about
          future fees or actual transaction size.
        </p>
      </section>

      <section
        id="privacy"
        class="detail-section privacy-section"
        aria-labelledby="privacy-title"
      >
        <p class="eyebrow">PRIVACY IS PART OF THE DECISION</p>
        <h2 id="privacy-title">Lower fees can mean less privacy.</h2>
        <p>
          Spending multiple inputs together can link them under the
          common-input-ownership heuristic. Mixing script types can reveal
          additional wallet patterns. Consider those costs before consolidating.
        </p>
      </section>
    </main>

    <footer class="site-footer">
      <p>
        For planning only. This tool never signs or broadcasts transactions.
      </p>
    </footer>

    <aside class="security-notice" aria-label="Privacy and security notice">
      This tool never asks for keys. It runs in your browser.
    </aside>
  </div>
</template>
