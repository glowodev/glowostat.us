import { setTimeout as sleep } from "node:timers/promises"
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { CORS_MAX_AGE_SECONDS } from "./lib/constants"
import type { WorkerEnv } from "./lib/env"
import { resolveWait, respondWithStatus } from "./lib/response"
import { randomRoute } from "./routes/random"
import { statusRoute } from "./routes/status"

const app = new OpenAPIHono<{ Bindings: WorkerEnv }>()

app.use("*", async (c, next) => {
  const start = performance.now()
  await next()
  c.res.headers.set(
    "Server-Timing",
    `total;dur=${(performance.now() - start).toFixed(1)}`,
  )
  c.res.headers.set("X-Build", c.env.BUILD_SHA)
  if (!c.res.headers.has("Cache-Control")) {
    c.res.headers.set("Cache-Control", "no-store")
  }
})

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["X-HttpStatus-Sleep"],
    exposeHeaders: ["X-Build", "Server-Timing"],
    maxAge: CORS_MAX_AGE_SECONDS,
  }),
)

app.openapi(statusRoute, async (c) => {
  const { code } = c.req.valid("param")
  await sleep(resolveWait(c.req.valid("query"), c.req.valid("header")))
  return respondWithStatus(c, code)
})

app.openapi(randomRoute, async (c) => {
  const { codes } = c.req.valid("param")
  await sleep(resolveWait(c.req.valid("query"), c.req.valid("header")))
  const idx = crypto.getRandomValues(new Uint32Array(1))[0]! % codes.length
  return respondWithStatus(c, codes[idx]!)
})

app.all("*", async (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
