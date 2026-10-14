<script setup lang="ts">
import { computed } from "vue";
import type { VerdictKind } from "../core/strategy";
import { usePlannerStore } from "../stores/plannerStore";
import { formatRate, formatSats } from "../utils/format";

const store = usePlannerStore();

const VERDICT_PRESENTATION: Readonly<
  Record<VerdictKind, { label: string; icon: string; tone: string }>
> = {
  "consolidate-now": {
    label: "Consolidate now",
    icon: "✓",
    tone: "text-positive",
  },
  wait: { label: "Wait", icon: "…", tone: "text-wait" },
  "not-worth-it": { label: "Not worth it", icon: "✕", tone: "text-warning" },
};

const presentation = computed(() =>
  store.verdict ? VERDICT_PRESENTATION[store.verdict.kind] : null,
);
</script>

<template>
  <section class="panel" aria-labelledby="results-title" aria-live="polite">
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
      estimate
    </p>
    <h2 id="results-title" class="mt-2 text-xl font-semibold text-content">
      Results
    </h2>

    <p v-if="store.feeErrors.length > 0" class="mt-4 text-sm text-muted">
      Fix the fee rates above to see results.
    </p>
    <p
      v-else-if="!store.recommendation || !store.verdict || !presentation"
      class="mt-4 text-sm text-muted"
    >
      Add at least one UTXO to see an estimate.
    </p>
    <template v-else>
      <div
        class="mt-4 border-l-4 border-current pl-4"
        :class="presentation.tone"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.16em]">verdict</p>
        <p class="mt-1 text-2xl font-semibold">
          <span aria-hidden="true">{{ presentation.icon }} </span
          >{{ presentation.label }}
        </p>
      </div>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-content">
        <li v-for="reason in store.verdict.reasons" :key="reason">
          {{ reason }}
        </li>
      </ul>

      <dl class="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-muted">Estimated net savings</dt>
          <dd class="text-2xl font-semibold tabular-nums text-content">
            {{ formatSats(store.recommendation.estimatedSavingsSats) }} sats
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Break-even fee rate</dt>
          <dd class="text-2xl font-semibold tabular-nums text-content">
            <template
              v-if="store.recommendation.breakEvenRateSatPerVb !== undefined"
            >
              {{ formatRate(store.recommendation.breakEvenRateSatPerVb) }}
              sat/vB
            </template>
            <template v-else>not applicable</template>
          </dd>
          <dd
            v-if="store.recommendation.breakEvenRateSatPerVb !== undefined"
            class="text-xs text-muted"
          >
            Consolidate when fees are below this rate.
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Estimated fee to consolidate now</dt>
          <dd class="text-2xl font-semibold tabular-nums text-content">
            {{ formatSats(store.costNowSats ?? 0) }} sats
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">
            UTXOs that cost more to spend than they hold
          </dt>
          <dd class="text-2xl font-semibold tabular-nums text-content">
            {{ store.recommendation.uneconomicalUtxos.length }}
          </dd>
        </div>
      </dl>

      <div
        v-if="store.recommendation.privacyWarnings.length > 0"
        class="mt-6 border-l-4 border-warning bg-warning/10 p-4"
      >
        <h3 class="text-sm font-semibold text-content">
          <span aria-hidden="true">⚠ </span>Privacy tradeoff
        </h3>
        <ul
          class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-content"
        >
          <li
            v-for="warning in store.recommendation.privacyWarnings"
            :key="warning"
          >
            {{ warning }}
          </li>
        </ul>
      </div>

      <p class="mt-6 text-xs leading-5 text-muted">
        Estimates use approximate transaction sizes and the fee rates you
        entered; future fees are uncertain. Savings are estimated, not
        guaranteed, and the model assumes one consolidation transaction with a
        single output. Review any transaction in your own wallet before signing.
      </p>
    </template>
  </section>
</template>
