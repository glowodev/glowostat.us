import { SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"

type StatusBody = {
  code: number
  description: string
}

const SAMPLE_RUNS = 30

describe("GET /random/:spec", () => {
  it("returns a code from the spec list", async () => {
    const allowed = new Set([200, 201])
    for (let i = 0; i < SAMPLE_RUNS; i++) {
      const res = await SELF.fetch("https://t.local/random/200,201")
      expect(allowed.has(res.status)).toBe(true)
    }
  })

  it("expands ranges into individual codes", async () => {
    const allowed = new Set([500, 501, 502, 503, 504])
    for (let i = 0; i < SAMPLE_RUNS; i++) {
      const res = await SELF.fetch("https://t.local/random/500-504")
      expect(allowed.has(res.status)).toBe(true)
    }
  })

  it("supports mixed values and ranges", async () => {
    const allowed = new Set([200, 201, 500, 501, 502, 503, 504])
    for (let i = 0; i < SAMPLE_RUNS; i++) {
      const res = await SELF.fetch("https://t.local/random/200,201,500-504")
      expect(allowed.has(res.status)).toBe(true)
    }
  })

  it("weights probability by repetition", async () => {
    let twoHundreds = 0
    const runs = 200
    for (let i = 0; i < runs; i++) {
      const res = await SELF.fetch("https://t.local/random/200,200,500")
      if (res.status === 200) twoHundreds++
    }
    // 2/3 ≈ 67%. Allow 50-85% to keep test stable.
    expect(twoHundreds / runs).toBeGreaterThan(0.5)
    expect(twoHundreds / runs).toBeLessThan(0.85)
  })

  it("returns JSON when Accept: application/json", async () => {
    const res = await SELF.fetch("https://t.local/random/418", {
      headers: { Accept: "application/json" },
    })
    expect(res.status).toBe(418)
    const body = (await res.json()) as StatusBody
    expect(body.code).toBe(418)
    expect(body.description).toBe("I'm a Teapot")
  })

  it("rejects malformed specs", async () => {
    const cases = ["abc", "200,abc", "200--500", "200,", ",200"]
    for (const spec of cases) {
      const res = await SELF.fetch(`https://t.local/random/${spec}`)
      expect(res.status).toBe(400)
    }
  })

  it("rejects ranges outside 200-599", async () => {
    const res = await SELF.fetch("https://t.local/random/50-99")
    expect(res.status).toBe(400)
  })

  it("rejects reversed ranges", async () => {
    const res = await SELF.fetch("https://t.local/random/300-200")
    expect(res.status).toBe(400)
  })
})
