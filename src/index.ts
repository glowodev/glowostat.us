import { setTimeout as sleep } from "node:timers/promises"
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import {
  BASIC_AUTH_REALM,
  CORS_MAX_AGE_SECONDS,
  WS_MAX_LIFETIME_MS,
  WS_MAX_MESSAGE_BYTES,
  WS_MAX_MESSAGES,
  WS_MAX_TOTAL_BYTES,
} from "./lib/constants"
import type { WorkerEnv } from "./lib/env"
import {
  decodeBasicAuth,
  requestEcho,
  resolveWait,
  respondWithStatus,
} from "./lib/response"
import { basicAuthRoute } from "./routes/basic-auth"
import { delayRoute } from "./routes/delay"
import { getRoute } from "./routes/get"
import { randomRoute } from "./routes/random"
import { redirectRoute } from "./routes/redirect"
import { statusRoute } from "./routes/status"

const app = new OpenAPIHono<{ Bindings: WorkerEnv }>()

const encoder = new TextEncoder()

// Registered before the middlewares on purpose: a 101 upgrade response has
// immutable headers, so the timing/CORS layers must never touch it.
// Non-upgrade requests fall through to the regular 426 handler below,
// which gets the standard middleware treatment.
app.use("/ws", async (c, next) => {
  if (c.req.header("Upgrade")?.toLowerCase() !== "websocket") {
    return next()
  }
  const pair = new WebSocketPair()
  const client = pair[0]
  const server = pair[1]
  server.accept()
  // Without this, binary frames can arrive as Blob, which send() would
  // silently coerce to the string "[object Blob]" instead of echoing bytes.
  server.binaryType = "arraybuffer"
  let messages = 0
  let totalBytes = 0
  const lifetime = setTimeout(
    () => server.close(1000, "max lifetime reached"),
    WS_MAX_LIFETIME_MS,
  )
  server.addEventListener("message", (event) => {
    if (server.readyState !== WebSocket.READY_STATE_OPEN) {
      return
    }
    // string.length is UTF-16 code units, not wire bytes — encode to count.
    const size =
      typeof event.data === "string"
        ? encoder.encode(event.data).byteLength
        : event.data.byteLength
    totalBytes += size
    if (size > WS_MAX_MESSAGE_BYTES || totalBytes > WS_MAX_TOTAL_BYTES) {
      server.close(1009, "message or connection byte budget exceeded")
      return
    }
    server.send(event.data)
    messages++
    if (messages >= WS_MAX_MESSAGES) {
      server.close(1000, "max messages reached")
    }
  })
  server.addEventListener("close", () => clearTimeout(lifetime))
  server.addEventListener("error", () => {
    clearTimeout(lifetime)
    server.close(1011, "error")
  })
  return new Response(null, { status: 101, webSocket: client })
})

app.use("*", async (c, next) => {
  const start = performance.now()
  await next()
  c.res.headers.set(
    "Server-Timing",
    `total;dur=${(performance.now() - start).toFixed(1)}`,
  )
  c.res.headers.set("X-Build", c.env.BUILD_SHA)
  c.res.headers.set("X-Content-Type-Options", "nosniff")
  if (!c.res.headers.has("Cache-Control")) {
    c.res.headers.set("Cache-Control", "no-store")
  }
})

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["X-HttpStatus-Sleep", "Authorization"],
    exposeHeaders: ["X-Build", "Server-Timing"],
    maxAge: CORS_MAX_AGE_SECONDS,
  }),
)

app.get("/ws", (c) =>
  c.text("Expected Upgrade: websocket", 426, { Upgrade: "websocket" }),
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

app.openapi(getRoute, async (c) => {
  await sleep(resolveWait(c.req.valid("query"), c.req.valid("header")))
  return c.json(requestEcho(c.req.raw), 200)
})

app.openapi(delayRoute, async (c) => {
  const { seconds } = c.req.valid("param")
  const wait = resolveWait(c.req.valid("query"), c.req.valid("header"))
  await sleep(Math.max(seconds * 1000, wait))
  return c.json(requestEcho(c.req.raw), 200)
})

app.openapi(redirectRoute, async (c) => {
  const { hops } = c.req.valid("param")
  await sleep(resolveWait(c.req.valid("query"), c.req.valid("header")))
  return c.redirect(hops > 1 ? `/redirect/${hops - 1}` : "/get", 302)
})

app.openapi(basicAuthRoute, async (c) => {
  const { user, passwd } = c.req.valid("param")
  await sleep(resolveWait(c.req.valid("query"), c.req.valid("header")))
  const presented = decodeBasicAuth(c.req.header("Authorization"))
  if (presented !== `${user}:${passwd}`) {
    return c.body(null, 401, {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
    })
  }
  return c.json({ authenticated: true as const, user }, 200)
})

app.all("*", async (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
