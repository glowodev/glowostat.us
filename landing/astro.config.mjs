import { execSync } from "node:child_process"
import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"

const safeExec = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {
    return ""
  }
}

const sha =
  process.env.BUILD_SHA || safeExec("git rev-parse --short HEAD") || "dev"

// Primary site URL. Override via BUILD_SITE for staging/preview builds or if
// the canonical hostname ever changes.
const site = process.env.BUILD_SITE || "https://glowostat.us"

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "ignore",
  integrations: [sitemap()],
  build: {
    assets: "_astro",
    inlineStylesheets: "auto",
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      __BUILD_SHA__: JSON.stringify(sha),
    },
  },
  devToolbar: {
    enabled: false,
  },
})
