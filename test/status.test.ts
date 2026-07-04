import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import {
  HTTP_MAX_STATUS,
  HTTP_MIN_STATUS,
  NULL_BODY_STATUSES,
} from "../src/lib/constants"

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

describe("GET /:code edge runtimes", () => {
  it("returns bodyless responses for null-body statuses (204, 205, 304)", async () => {
    for (const code of NULL_BODY_STATUSES) {
      const res = await SELF.fetch(`https://t.local/${code}`)
      expect(res.status).toBe(code)
      expect(await res.text()).toBe("")
    }
  })

  it("returns bodyless 304 even with Accept: application/json", async () => {
    const res = await SELF.fetch("https://t.local/304", {
      headers: { Accept: "application/json" },
    })
    expect(res.status).toBe(304)
    expect(await res.text()).toBe("")
  })

  it("rejects 1xx codes the Workers Fetch runtime cannot emit", async () => {
    for (const code of [100, 101, 102, 103, 150, 199]) {
      const res = await SELF.fetch(`https://t.local/${code}`)
      expect(res.status).toBe(400)
    }
  })

  it("returns the documented ValidationError shape on validation failure", async () => {
    const res = await SELF.fetch("https://t.local/200?sleep=9999999")
    expect(res.status).toBe(400)
    const body = (await res.json()) as {
      success: boolean
      error: {
        name: string
        message: string
      }
    }
    expect(body.success).toBe(false)
    expect(body.error.name).toBe("ZodError")
    expect(typeof body.error.message).toBe("string")
    const issues = JSON.parse(body.error.message) as Array<{ path: string[] }>
    expect(Array.isArray(issues)).toBe(true)
    expect(issues[0]?.path).toEqual(["sleep"])
  })
})

describe("round-trip invariant", () => {
  it("returns the exact requested code for every accepted code", async () => {
    const codes = Array.from(
      { length: HTTP_MAX_STATUS - HTTP_MIN_STATUS + 1 },
      (_, i) => HTTP_MIN_STATUS + i,
    )
    const mismatches = await Promise.all(
      codes.map(async (code) => {
        const res = await SELF.fetch(`https://t.local/${code}`)
        return res.status === code ? null : { code, actual: res.status }
      }),
    )
    const failures = mismatches.filter((m) => m !== null)
    if (failures.length > 0) {
      throw new Error(
        `round-trip mismatches: ${JSON.stringify(failures.slice(0, 10))}`,
      )
    }
  }, 20000)
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

  it("rejects sleep above the 65-second cap", async () => {
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
