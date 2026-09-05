import { defineConfig } from "vite";

// GitHub Pages project site: https://<user>.github.io/towerdefense/
export default defineConfig({
  base: "/towerdefense/",
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
