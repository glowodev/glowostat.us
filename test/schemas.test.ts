import { describe, expect, it } from "vitest"
import { randomSpec, statusCodeParam } from "../src/lib/schemas"

describe("statusCodeParam", () => {
  it("accepts every code 200-599", () => {
    for (let code = 200; code <= 599; code++) {
      expect(statusCodeParam.safeParse(code).success).toBe(true)
    }
  })

  it("coerces numeric strings", () => {
    const r = statusCodeParam.safeParse("404")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBe(404)
  })

  it("rejects out-of-range codes", () => {
    expect(statusCodeParam.safeParse(99).success).toBe(false)
    expect(statusCodeParam.safeParse(100).success).toBe(false)
    expect(statusCodeParam.safeParse(199).success).toBe(false)
    expect(statusCodeParam.safeParse(600).success).toBe(false)
    expect(statusCodeParam.safeParse(0).success).toBe(false)
  })

  it("rejects non-integers", () => {
    expect(statusCodeParam.safeParse(200.5).success).toBe(false)
    expect(statusCodeParam.safeParse("abc").success).toBe(false)
  })
})

describe("randomSpec", () => {
  it("parses a single code", () => {
    const r = randomSpec.safeParse("200")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual([200])
  })

  it("parses a comma-separated list", () => {
    const r = randomSpec.safeParse("200,201,418")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual([200, 201, 418])
  })

  it("expands ranges", () => {
    const r = randomSpec.safeParse("500-504")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual([500, 501, 502, 503, 504])
  })

  it("mixes single codes and ranges", () => {
    const r = randomSpec.safeParse("200,201,500-502")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual([200, 201, 500, 501, 502])
  })

  it("preserves duplicates for weighting", () => {
    const r = randomSpec.safeParse("200,200,500")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual([200, 200, 500])
  })

  it("rejects empty input", () => {
    expect(randomSpec.safeParse("").success).toBe(false)
  })

  it("rejects malformed specs", () => {
    expect(randomSpec.safeParse("abc").success).toBe(false)
    expect(randomSpec.safeParse("200,abc").success).toBe(false)
    expect(randomSpec.safeParse("200--500").success).toBe(false)
    expect(randomSpec.safeParse("200,").success).toBe(false)
    expect(randomSpec.safeParse(",200").success).toBe(false)
    expect(randomSpec.safeParse("200 201").success).toBe(false)
  })

  it("rejects out-of-range single codes", () => {
    expect(randomSpec.safeParse("99").success).toBe(false)
    expect(randomSpec.safeParse("100").success).toBe(false)
    expect(randomSpec.safeParse("199").success).toBe(false)
    expect(randomSpec.safeParse("600").success).toBe(false)
  })

  it("rejects out-of-range ranges", () => {
    expect(randomSpec.safeParse("50-99").success).toBe(false)
    expect(randomSpec.safeParse("100-199").success).toBe(false)
    expect(randomSpec.safeParse("199-200").success).toBe(false)
    expect(randomSpec.safeParse("550-650").success).toBe(false)
  })

  it("rejects reversed ranges", () => {
    expect(randomSpec.safeParse("500-200").success).toBe(false)
    expect(randomSpec.safeParse("404-403").success).toBe(false)
  })

  it("accepts a single-element range", () => {
    const r = randomSpec.safeParse("200-200")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual([200])
  })

  it("rejects expansion beyond the safety cap", () => {
    const ranges = Array(26).fill("200-599").join(",")
    expect(randomSpec.safeParse(ranges).success).toBe(false)
  })
})
