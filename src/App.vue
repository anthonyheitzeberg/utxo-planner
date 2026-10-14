<script setup lang="ts">
import HomeView from "./views/HomeView.vue";
import PlannerView from "./views/PlannerView.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SiteNav from "./components/SiteNav.vue";
import { useHashRoute } from "./composables/useHashRoute";

const route = useHashRoute();
</script>

<template>
  <SiteNav />
  <PlannerView v-if="route === 'planner'" />
  <HomeView v-else />
  <SiteFooter />
</template>
