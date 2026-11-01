import { defineConfig } from "vite";
import { cp, stat, readdir, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

// builds.json lives at the repo root because the GitHub workflow and the /api functions read it there.
// assets/ also stays at the root. This plugin copies both into dist/ at build time.
// Vite's dev server already serves root files, so nothing is needed for `npm run dev`.
const MAX_ASSET_BYTES = 600 * 1024; // skip the original multi-MB source PNGs

function copyRootStatic() {
  let outDir = "dist";
  return {
    name: "wowadvisor-copy-root-static",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await cp(path.resolve("builds.json"), path.join(outDir, "builds.json"));
      await copyDir(path.resolve("assets"), path.join(outDir, "assets"));
    }
  };
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else if ((await stat(from)).size <= MAX_ASSET_BYTES && !entry.name.startsWith(".")) {
      await copyFile(from, to);
    }
  }
}

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    assetsDir: "static",
    target: "es2020",
    sourcemap: true
  },
  plugins: [copyRootStatic()],
  server: {
    port: 5173,
    // When running `vercel dev` on 3000 alongside `vite`, API calls are proxied there.
    proxy: process.env.VITE_API_PROXY ? { "/api": process.env.VITE_API_PROXY } : undefined
  }
});
