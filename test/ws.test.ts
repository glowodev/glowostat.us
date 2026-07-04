import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import {
  WS_MAX_MESSAGE_BYTES,
  WS_MAX_MESSAGES,
  WS_MAX_TOTAL_BYTES,
} from "../src/lib/constants"

const connect = async (): Promise<WebSocket> => {
  const res = await SELF.fetch("https://t.local/ws", {
    headers: { Upgrade: "websocket" },
  })
  expect(res.status).toBe(101)
  const ws = res.webSocket
  if (!ws) throw new Error("no webSocket on 101 response")
  ws.accept()
  return ws
}

// The test-side socket delivers binary frames as Blob regardless of
// binaryType; normalize so assertions can compare bytes.
const toBytes = async (
  data: string | ArrayBuffer | Blob,
): Promise<Uint8Array> => {
  if (typeof data === "string") return new TextEncoder().encode(data)
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  return new Uint8Array(await data.arrayBuffer())
}

const nextMessage = (ws: WebSocket): Promise<string | ArrayBuffer | Blob> =>
  new Promise((resolve, reject) => {
    ws.addEventListener("message", (event) => resolve(event.data), {
      once: true,
    })
    ws.addEventListener("error", reject, { once: true })
  })

const nextClose = (ws: WebSocket): Promise<CloseEvent> =>
  new Promise((resolve) => {
    ws.addEventListener("close", (event) => resolve(event), { once: true })
  })

describe("GET /ws", () => {
  it("returns 426 without an Upgrade header, with standard headers", async () => {
    const res = await SELF.fetch("https://t.local/ws")
    expect(res.status).toBe(426)
    expect(res.headers.get("Upgrade")).toBe("websocket")
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  it("echoes text messages", async () => {
    const ws = await connect()
    const reply = nextMessage(ws)
    ws.send("ping")
    expect(await reply).toBe("ping")
    ws.close()
  })

  it("echoes binary messages", async () => {
    const ws = await connect()
    const reply = nextMessage(ws)
    const payload = new Uint8Array([1, 2, 3, 4])
    ws.send(payload.buffer)
    const echoed = await reply
    expect(typeof echoed).not.toBe("string")
    expect(await toBytes(echoed)).toEqual(payload)
    ws.close()
  })

  it("closes with 1009 on oversized messages", async () => {
    const ws = await connect()
    const closed = nextClose(ws)
    ws.send("x".repeat(WS_MAX_MESSAGE_BYTES + 1))
    const event = await closed
    expect(event.code).toBe(1009)
  })

  it("measures text frames in UTF-8 bytes, not UTF-16 code units", async () => {
    const ws = await connect()
    const closed = nextClose(ws)
    // 30k '€' = 30k code units (passes a length check) but 90k UTF-8 bytes.
    ws.send("€".repeat(30_000))
    const event = await closed
    expect(event.code).toBe(1009)
  })

  it("closes when the per-connection byte budget is exhausted", async () => {
    const ws = await connect()
    const closed = nextClose(ws)
    const frame = "x".repeat(WS_MAX_MESSAGE_BYTES)
    const frames = Math.ceil(WS_MAX_TOTAL_BYTES / WS_MAX_MESSAGE_BYTES) + 1
    for (let i = 0; i < frames; i++) ws.send(frame)
    const event = await closed
    expect(event.code).toBe(1009)
  })

  it("closes cleanly after the max message count", async () => {
    const ws = await connect()
    const closed = nextClose(ws)
    let echoes = 0
    ws.addEventListener("message", () => echoes++)
    for (let i = 0; i < WS_MAX_MESSAGES + 5; i++) ws.send("x")
    const event = await closed
    expect(event.code).toBe(1000)
    expect(echoes).toBe(WS_MAX_MESSAGES)
  })
})
