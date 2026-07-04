import { describe, expect, it } from "vitest"
import { resolveWait } from "../src/lib/response"
import { reasonFor } from "../src/lib/status-codes"

describe("reasonFor", () => {
  it("returns canonical IANA phrases", () => {
    expect(reasonFor(200)).toBe("OK")
    expect(reasonFor(301)).toBe("Moved Permanently")
    expect(reasonFor(418)).toBe("I'm a Teapot")
    expect(reasonFor(429)).toBe("Too Many Requests")
    expect(reasonFor(503)).toBe("Service Unavailable")
  })

  it("returns Nginx phrases for non-IANA codes", () => {
    expect(reasonFor(444)).toBe("No Response")
    expect(reasonFor(499)).toBe("Client Closed Request")
  })

  it("returns Cloudflare phrases for 52x codes", () => {
    expect(reasonFor(522)).toBe("Connection Timed Out")
    expect(reasonFor(525)).toBe("SSL Handshake Failed")
  })

  it("falls back to 'Unknown Status Code' for unmapped codes", () => {
    expect(reasonFor(599)).toBe("Unknown Status Code")
    expect(reasonFor(420)).toBe("Unknown Status Code")
  })
})

describe("resolveWait", () => {
  it("returns 0 when neither query nor header is set", () => {
    expect(resolveWait({}, {})).toBe(0)
  })

  it("returns the query value when only query is set", () => {
    expect(resolveWait({ sleep: 250 }, {})).toBe(250)
  })

  it("returns the header value when only header is set", () => {
    expect(resolveWait({}, { "x-httpstatus-sleep": 250 })).toBe(250)
  })

  it("returns the larger of the two when both are set", () => {
    expect(resolveWait({ sleep: 100 }, { "x-httpstatus-sleep": 300 })).toBe(300)
    expect(resolveWait({ sleep: 500 }, { "x-httpstatus-sleep": 200 })).toBe(500)
  })

  it("treats undefined as zero", () => {
    expect(
      resolveWait({ sleep: undefined }, { "x-httpstatus-sleep": 100 }),
    ).toBe(100)
  })
})
