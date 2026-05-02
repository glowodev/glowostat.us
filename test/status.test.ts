import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"

describe("GET /:code", () => {
  it("returns the requested status with text body", async () => {
    const res = await SELF.fetch("https://t.local/500")
    expect(res.status).toBe(500)
    expect(res.headers.get("Content-Type")).toMatch(/text\/plain/)
    expect(await res.text()).toBe("500 Internal Server Error")
  })

  it("returns canonical reason phrase for IANA codes", async () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [200, "OK"],
      [301, "Moved Permanently"],
      [418, "I'm a Teapot"],
      [429, "Too Many Requests"],
      [503, "Service Unavailable"],
    ]
    for (const [code, reason] of cases) {
      const res = await SELF.fetch(`https://t.local/${code}`)
      expect(res.status).toBe(code)
      expect(await res.text()).toBe(`${code} ${reason}`)
    }
  })

  it("returns canonical reason phrase for non-IANA codes", async () => {
    const res = await SELF.fetch("https://t.local/522")
    expect(res.status).toBe(522)
    expect(await res.text()).toBe("522 Connection Timed Out")
  })

  it("returns JSON body when Accept: application/json", async () => {
    const res = await SELF.fetch("https://t.local/404", {
      headers: { Accept: "application/json" },
    })
    expect(res.status).toBe(404)
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/)
    expect(await res.json()).toEqual({ code: 404, description: "Not Found" })
  })

  it("returns 'Unknown Status Code' for valid-but-unknown codes", async () => {
    const res = await SELF.fetch("https://t.local/599")
    expect(res.status).toBe(599)
    expect(await res.text()).toBe("599 Unknown Status Code")
  })

  it("attaches Cache-Control: no-store and X-Build", async () => {
    const res = await SELF.fetch("https://t.local/200")
    expect(res.headers.get("Cache-Control")).toBe("no-store")
    expect(res.headers.get("X-Build")).toBeTruthy()
  })

  it("attaches Server-Timing", async () => {
    const res = await SELF.fetch("https://t.local/200")
    expect(res.headers.get("Server-Timing")).toMatch(/^total;dur=/)
  })

  it("falls through to assets for non-status paths", async () => {
    const res = await SELF.fetch("https://t.local/openapi.json")
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/)
  })
})

describe("GET /:code with sleep", () => {
  it("delays response by ?sleep= ms", async () => {
    const start = Date.now()
    const res = await SELF.fetch("https://t.local/200?sleep=200")
    const elapsed = Date.now() - start
    expect(res.status).toBe(200)
    expect(elapsed).toBeGreaterThanOrEqual(180)
  })

  it("delays response by X-HttpStatus-Sleep header ms", async () => {
    const start = Date.now()
    const res = await SELF.fetch("https://t.local/200", {
      headers: { "X-HttpStatus-Sleep": "200" },
    })
    const elapsed = Date.now() - start
    expect(res.status).toBe(200)
    expect(elapsed).toBeGreaterThanOrEqual(180)
  })

  it("uses the longer of query and header", async () => {
    const start = Date.now()
    const res = await SELF.fetch("https://t.local/200?sleep=300", {
      headers: { "X-HttpStatus-Sleep": "100" },
    })
    const elapsed = Date.now() - start
    expect(res.status).toBe(200)
    expect(elapsed).toBeGreaterThanOrEqual(280)
  })

  it("rejects sleep above the 5-minute cap", async () => {
    const res = await SELF.fetch("https://t.local/200?sleep=999999999")
    expect(res.status).toBe(400)
  })

  it("rejects negative sleep", async () => {
    const res = await SELF.fetch("https://t.local/200?sleep=-1")
    expect(res.status).toBe(400)
  })

  it("rejects non-numeric sleep", async () => {
    const res = await SELF.fetch("https://t.local/200?sleep=abc")
    expect(res.status).toBe(400)
  })
})
