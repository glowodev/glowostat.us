import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { OpenAPIHono } from "@hono/zod-openapi"
import { randomRoute } from "../src/routes/random"
import { statusRoute } from "../src/routes/status"

const app = new OpenAPIHono()
app.openapi(statusRoute, async () => new Response())
app.openapi(randomRoute, async () => new Response())

const doc = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: {
    title: "glowostat.us",
    version: "1.0.0",
    description:
      "Public dev utility for testing HTTP status codes. Point any client at a URL, get back the status code you ask for. Free, edge-served, open source.",
    license: {
      name: "MIT",
      url: "https://github.com/glowodev/glowostat.us/blob/main/LICENSE",
    },
  },
  servers: [{ url: "https://glowostat.us", description: "Production" }],
})

const cleanedPaths: typeof doc.paths = {}
for (const [path, ops] of Object.entries(doc.paths)) {
  cleanedPaths[path.replaceAll(/\/:(\w+)(\{[^}]*\})?/g, "/{$1}")] = ops
}
doc.paths = cleanedPaths

const outDir = resolve("landing/public")
const outPath = resolve(outDir, "openapi.json")
await mkdir(outDir, { recursive: true })
await writeFile(outPath, JSON.stringify(doc, null, 2))
console.log(`generated ${outPath}`)
