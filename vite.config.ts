import { defineConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, cpSync, existsSync } from "fs";
import { build as esbuild } from "esbuild";

export default defineConfig({
  root: resolve(import.meta.dirname),
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "src/popup/popup.html"),
        welcome: resolve(import.meta.dirname, "src/welcome/welcome.html"),
      },
    },
  },
  plugins: [
    {
      name: "build-extension-scripts-and-assets",
      async closeBundle() {
        // 1. Copy manifest.json to dist/manifest.json
        if (existsSync("vendor/manifest.json")) {
          copyFileSync("vendor/manifest.json", "dist/manifest.json");
        }

        // 2. Copy assets directory to dist/assets
        if (existsSync("assets")) {
          cpSync("assets", "dist/assets", { recursive: true });
        }

        // 3. Bundle standalone TS scripts using esbuild
        const scriptsToBundle = [
          {
            in: resolve(import.meta.dirname, "src/background/background.ts"),
            out: resolve(import.meta.dirname, "dist/src/background/background.js"),
            format: "esm" as const,
          },
          {
            in: resolve(import.meta.dirname, "src/content/leetcode/leetcode.ts"),
            out: resolve(import.meta.dirname, "dist/src/content/leetcode/leetcode.js"),
            format: "iife" as const,
          },
          {
            in: resolve(import.meta.dirname, "src/content/geeksforgeeks/geeksforgeeks.ts"),
            out: resolve(import.meta.dirname, "dist/src/content/geeksforgeeks/geeksforgeeks.js"),
            format: "iife" as const,
          },
          {
            in: resolve(import.meta.dirname, "src/github/authentication.ts"),
            out: resolve(import.meta.dirname, "dist/src/github/authentication.js"),
            format: "iife" as const,
          },
        ];

        for (const script of scriptsToBundle) {
          const outDir = resolve(script.out, "..");
          if (!existsSync(outDir)) {
            mkdirSync(outDir, { recursive: true });
          }

          await esbuild({
            entryPoints: [script.in],
            outfile: script.out,
            bundle: true,
            format: script.format,
            platform: "browser",
            target: "es2022",
            minify: false,
          });
        }
      },
    },
  ],
});
