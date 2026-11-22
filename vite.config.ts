import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "sync-source-config",
      buildStart() {
        copyFileSync("config/sources.json", "public/sources.json");
      },
    },
  ],
  base: "./",
});
