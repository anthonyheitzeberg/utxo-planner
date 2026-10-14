<script setup lang="ts">
import DisclaimerBar from "../components/DisclaimerBar.vue";
import HeroSection from "../components/HeroSection.vue";
import SectionBlock from "../components/SectionBlock.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SiteNav from "../components/SiteNav.vue";
import StatRow from "../components/StatRow.vue";
import ValueProp from "../components/ValueProp.vue";

const statusItems = [
  {
    value: "—",
    label: "estimated savings",
    note: "Placeholder: calculated results are not available yet.",
  },
  {
    value: "—",
    label: "break-even rate",
    note: "Placeholder: fee assumptions are not available yet.",
  },
  {
    value: "—",
    label: "uneconomical UTXOs",
    note: "Placeholder: UTXO analysis is not available yet.",
  },
] as const;
</script>

<template>
  <SiteNav />
  <main>
    <HeroSection
      eyebrow="step 1 · placeholder landing page"
      title="Consolidate when the fee is right."
      description="Placeholder copy: consolidation pays a fee now to combine small inputs, in the hope that a future spend costs less. This project will compare those estimates and make the privacy tradeoff visible."
    >
      <ValueProp
        label="private by build"
        description="Placeholder: the project is designed to run in your browser. No address lookup or Bitcoin API request is implemented in this step."
      />
      <ValueProp
        label="estimated, not guaranteed"
        description="Placeholder: future fee rates and transaction sizes are uncertain, so any result warrants checking."
      />
      <ValueProp
        label="privacy matters"
        description="Placeholder: spending inputs together can publicly link them through the common-input-ownership heuristic."
      />
    </HeroSection>

    <StatRow :items="statusItems" />

    <SectionBlock
      id="cost-model"
      eyebrow="methodology · placeholder"
      title="A simple question, made explicit."
    >
      <p>
        Placeholder: a consolidation is worth considering only when the
        estimated reduction in future input fees exceeds the fee paid now.
        Amounts are integer sats and fee rates are sat/vB.
      </p>
      <p>
        The core model is implemented, but this page does not collect UTXOs or
        calculate a personal plan. The values above are intentionally blank, not
        measured results.
      </p>
    </SectionBlock>

    <SectionBlock
      id="privacy"
      eyebrow="privacy · placeholder"
      title="Lower fees can mean less privacy."
    >
      <p>
        Placeholder: spending multiple inputs together can link them under the
        common-input-ownership heuristic. Address lookup is not implemented.
      </p>
      <p>
        No planner UI, CSV import, or API calls are part of this first step.
      </p>
    </SectionBlock>

    <DisclaimerBar
      message="Placeholder: estimates will depend on assumed transaction sizes and a future fee-rate estimate. Review any transaction in your own wallet before signing."
    />
  </main>
  <SiteFooter />
</template>
