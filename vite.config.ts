import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/utxo-planner/",
  plugins: [vue(), tailwindcss()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
