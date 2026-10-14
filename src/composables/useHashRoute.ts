import { onBeforeUnmount, onMounted, ref, nextTick, type Ref } from "vue";

export type AppRoute = "home" | "planner";

const PLANNER_HASH = "#/planner";

function routeFromHash(hash: string): AppRoute {
  return hash === PLANNER_HASH ? "planner" : "home";
}

/**
 * Track the hash route. `#/planner` is the planner; any other hash is home,
 * and in-page anchors such as `#privacy` scroll after the home view renders.
 */
export function useHashRoute(): Ref<AppRoute> {
  const route = ref<AppRoute>(routeFromHash(window.location.hash));

  async function onHashChange(): Promise<void> {
    const { hash } = window.location;
    route.value = routeFromHash(hash);
    await nextTick();
    if (route.value === "home" && hash.length > 1 && !hash.startsWith("#/")) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  onMounted(() => window.addEventListener("hashchange", onHashChange));
  onBeforeUnmount(() => window.removeEventListener("hashchange", onHashChange));
  return route;
}
